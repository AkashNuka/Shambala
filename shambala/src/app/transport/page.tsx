import Link from 'next/link';
import { TransactionCard } from '@/components/TransactionCard';
import { deleteRecord } from '@/actions/transactions';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';

async function getTransportRecords(limit = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transport_records')
    .select(`
      *,
      vehicle:transport_vehicles(vehicle_number, vehicle_type),
      delivery:material_deliveries(date, material:materials(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load transport records');
  return data;
}

export default async function TransportPage() {
  const records = await getTransportRecords();

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Transport Records</h1>
      </div>

      <div className="space-y-4">
        {records.map((r) => {
          const vehicle = r.vehicle as any;
          const delivery = r.delivery as any;
          const date = delivery?.date || new Date().toISOString().split('T')[0];
          const materialName = delivery?.material?.name || '';

          return (
            <TransactionCard
              key={r.id}
              title={vehicle ? `${vehicle.vehicle_type} (${vehicle.vehicle_number})` : 'Transport'}
              subtitle={[r.source_location, materialName].filter(Boolean).join(' → ') || 'Transport'}
              amount={r.amount}
              date={date}
              module="transport"
              icon="🚚"
              onDelete={async () => {
                'use server';
                await deleteRecord('transport_records', r.id);
              }}
            />
          );
        })}

        {records.length === 0 && (
          <div className="text-center text-text-muted py-8">
            No transport records found.
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/transport/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </main>
  );
}
