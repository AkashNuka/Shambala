import Link from 'next/link';
import { getMaterialDeliveries } from '@/actions/materials';
import { deleteRecord } from '@/actions/transactions';
import { TransactionCard } from '@/components/TransactionCard';

export default async function MaterialsPage() {
  const records = await getMaterialDeliveries();

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Materials & Deliveries</h1>
      </div>

      <div className="space-y-4">
        {records.map((r) => (
          <TransactionCard
            key={r.id}
            title={`${r.material?.name} ${r.variant?.name ? `(${r.variant.name})` : ''}`}
            subtitle={`${r.quantity} ${r.unit} from ${r.supplier?.name || 'Unknown'}`}
            amount={r.material_cost}
            date={r.date}
            module="materials"
            icon="🧱"
            onDelete={async () => {
              'use server';
              await deleteRecord('material_deliveries', r.id);
            }}
          />
        ))}

        {records.length === 0 && (
          <div className="text-center text-text-muted py-8">
            No material deliveries found.
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/materials/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </main>
  );
}
