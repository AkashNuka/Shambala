import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TABLES = [
  'parties',
  'transactions',
  'labour_records',
  'food_records',
  'machinery_records',
  'salary_records',
  'material_deliveries',
  'transport_records',
  'weighbridge_records',
  'fuel_records',
  'buildings',
  'machinery',
  'worker_types',
  'work_types',
  'food_categories'
];

export async function GET() {
  try {
    const supabase = await createClient();
    const backupData: Record<string, any[]> = {};

    // Fetch all tables
    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        backupData[table] = []; // fallback
      } else {
        backupData[table] = data || [];
      }
    }

    // Add metadata
    const finalBackup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: backupData
    };

    return new NextResponse(JSON.stringify(finalBackup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shambala-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
