import { getAccounts } from '@/actions/accounts';
import { getParties } from '@/actions/parties';
import { MoneyInForm } from './MoneyInForm';

export default async function MoneyInPage() {
  const [accounts, people] = await Promise.all([
    getAccounts(),
    getParties(undefined, 'investor'),
  ]);

  return <MoneyInForm initialAccounts={accounts} initialPeople={people} />;
}

