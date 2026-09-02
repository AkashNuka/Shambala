import { getParties } from '@/actions/parties';
import { getAccounts } from '@/actions/accounts';
import { SalaryForm } from './SalaryForm';

export default async function AddSalaryPage() {
  const [salariedParties, investorParties, accs] = await Promise.all([
    getParties(undefined, 'salaried'),
    getParties(undefined, 'investor'),
    getAccounts(),
  ]);

  return (
    <SalaryForm 
      initialEmployees={salariedParties}
      initialProviders={investorParties}
      accounts={accs}
    />
  );
}
