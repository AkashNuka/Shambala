import { getParties } from '@/actions/parties';
import { getTransportVehicles } from '@/actions/master';
import { getAccounts } from '@/actions/accounts';
import { TransportForm } from './TransportForm';

export default async function AddTransportPage() {
  const [vehs, investorParties, accs] = await Promise.all([
    getTransportVehicles(),
    getParties(undefined, 'investor'),
    getAccounts(),
  ]);

  return (
    <TransportForm 
      initialVehicles={vehs}
      initialProviders={investorParties}
      accounts={accs}
    />
  );
}
