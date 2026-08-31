import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID, DEFAULT_CASH_ACCOUNT_ID } from '@/lib/constants';
import type { ParsedRow } from '@/lib/excel-parser';

export async function POST(request: NextRequest) {
  try {
    const { rows } = (await request.json()) as { rows: ParsedRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get existing parties for name matching
    const { data: existingParties } = await supabase
      .from('parties')
      .select('id, name')
      .eq('project_id', DEFAULT_PROJECT_ID);

    const partyMap = new Map<string, string>();
    for (const p of existingParties || []) {
      partyMap.set(p.name.toUpperCase(), p.id);
    }

    let imported = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const d = row.parsedData;
        if (!d.amount || d.amount <= 0) {
          failed++;
          continue;
        }

        // Resolve or create party
        let partyId: string | null = null;
        if (d.party) {
          const upperName = d.party.toUpperCase();
          if (partyMap.has(upperName)) {
            partyId = partyMap.get(upperName)!;
          } else {
            const { data: newParty } = await supabase
              .from('parties')
              .insert({
                project_id: DEFAULT_PROJECT_ID,
                name: d.party,
                type: 'other',
              })
              .select('id')
              .single();
            if (newParty) {
              partyId = newParty.id;
              partyMap.set(upperName, newParty.id);
            }
          }
        }

        // Determine payment method and account
        const paymentMethod = d.paymentMethod || 'cash';
        const accountId = paymentMethod === 'bank_transfer'
          ? '00000000-0000-0000-0000-000000000011' // IDBI Bank
          : DEFAULT_CASH_ACCOUNT_ID;

        // Map transaction type
        const type = d.type || 'expense';

        const { error: txnError } = await supabase
          .from('transactions')
          .insert({
            project_id: DEFAULT_PROJECT_ID,
            type,
            date: d.date || new Date().toISOString().split('T')[0],
            amount: d.amount,
            account_id: accountId,
            category_id: d.categoryId || null,
            party_id: partyId,
            description: d.description || null,
            payment_method: paymentMethod,
          });

        if (txnError) {
          console.error('Failed to import row:', txnError);
          failed++;
        } else {
          imported++;
        }
      } catch (err) {
        console.error('Row import error:', err);
        failed++;
      }
    }

    return NextResponse.json({ imported, failed, total: rows.length });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}
