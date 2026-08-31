import Link from 'next/link';
import { getMachineryRecords } from '@/actions/machinery';
import { deleteRecord } from '@/actions/transactions';
import { TransactionCard } from '@/components/TransactionCard';

export default async function MachineryPage() {
  const records = await getMachineryRecords();

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Machinery Records</h1>
      </div>

      <div className="space-y-4">
        {records.map((r) => (
          <TransactionCard
            key={r.id}
            title={`${r.machine?.machine_type} (${r.machine?.machine_id})`}
            subtitle={`Op: ${r.operator?.name || 'Unknown'} - ${r.hours ? r.hours + ' hrs' : 'Flat'}`}
            amount={r.amount}
            date={r.date}
            module="machinery"
            icon="🚜"
            onDelete={async () => {
              'use server';
              await deleteRecord('machinery_records', r.id);
            }}
          />
        ))}

        {records.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No machinery records found.
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/machinery/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </main>
  );
}
