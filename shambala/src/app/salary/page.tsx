import Link from 'next/link';
import { getSalaryRecords } from '@/actions/salary';
import { deleteRecord } from '@/actions/transactions';
import { TransactionCard } from '@/components/TransactionCard';

export default async function SalaryPage() {
  const records = await getSalaryRecords();

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Salary Records</h1>
      </div>

      <div className="space-y-4">
        {records.map((r) => (
          <TransactionCard
            key={r.id}
            title={r.employee?.name || 'Unknown Employee'}
            subtitle={`${r.start_date} to ${r.end_date}`}
            amount={r.amount}
            date={r.payment_date}
            module="salary"
            icon="💰"
            onDelete={async () => {
              'use server';
              await deleteRecord('salary_records', r.id);
            }}
          />
        ))}

        {records.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No salary records found.
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        href="/salary/add"
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </main>
  );
}
