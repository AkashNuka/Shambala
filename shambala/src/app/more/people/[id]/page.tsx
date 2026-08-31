import { getParty, getPartyTransactions } from '@/actions/parties';
import { PARTY_CLASS_LABELS } from '@/lib/constants';
import { TransactionCard } from '@/components/TransactionCard';
import { DeletePartyButton } from '@/components/DeletePartyButton';
import Link from 'next/link';

export default async function PersonLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const party = await getParty(id);
  const transactions = await getPartyTransactions(id);

  const totalPaid = transactions
    .filter(t => t.type === 'supplier_payment' || t.type === 'operational_expense' || t.type === 'general_expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalReceived = transactions
    .filter(t => t.type === 'money_in')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/more/people" className="w-10 h-10 flex items-center justify-center bg-bg-card border border-border rounded-xl text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{party.name}</h1>
            <p className="text-sm text-text-muted">{PARTY_CLASS_LABELS[party.class]}</p>
          </div>
        </div>
        <DeletePartyButton partyId={party.id} partyName={party.name} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-bg-card border border-border p-4 rounded-2xl">
          <p className="text-xs text-text-muted mb-1">Paid to them</p>
          <p className="text-lg font-bold text-red-400">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-bg-card border border-border p-4 rounded-2xl">
          <p className="text-xs text-text-muted mb-1">Received from them</p>
          <p className="text-lg font-bold text-green-400">₹{totalReceived.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Transactions</h2>
      <div className="space-y-4">
        {transactions.map(t => (
          <TransactionCard
            key={t.id}
            title={t.description || t.type.replace('_', ' ')}
            subtitle={`Ref: ${t.reference_table || 'Direct'}`}
            amount={t.amount}
            date={t.date}
            module={t.type}
            isIncome={t.type === 'money_in'}
          />
        ))}

        {transactions.length === 0 && (
          <div className="text-center text-text-muted py-8">
            No transactions found for this person.
          </div>
        )}
      </div>
    </main>
  );
}
