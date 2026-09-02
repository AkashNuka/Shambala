import { APP_NAME } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name),
        party:parties(name),
        account:accounts!transactions_account_id_fkey(name)
      `)
      .eq('project_id', DEFAULT_PROJECT_ID)
      .is('deleted_at', null)
      .order('date', { ascending: true });

    // Apply filters
    if (type !== 'all') {
      query = query.eq('type', type);
    }
    if (month && year) {
      const firstDay = `${year}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).toLocaleDateString('en-CA');
      query = query.gte('date', firstDay).lte('date', lastDay);
    }

    const { data: transactions, error } = await query;
    if (error) throw new Error(error.message);

    // Build Excel data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (transactions || []).map((txn: any) => ({
      Date: txn.date,
      Type: txn.type,
      Category: (Array.isArray(txn.category) ? txn.category[0]?.name : txn.category?.name) || '',
      'Paid To / From': (Array.isArray(txn.party) ? txn.party[0]?.name : txn.party?.name) || '',
      Amount: txn.amount,
      'Payment Method': txn.payment_method,
      Account: (Array.isArray(txn.account) ? txn.account[0]?.name : txn.account?.name) || '',
      Description: txn.description || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 16 }, // Type
      { wch: 18 }, // Category
      { wch: 25 }, // Paid To
      { wch: 14 }, // Amount
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Account
      { wch: 40 }, // Description
    ];

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${APP_NAME.toLowerCase()}-export-${new Date().toLocaleDateString('en-CA')}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    );
  }
}
