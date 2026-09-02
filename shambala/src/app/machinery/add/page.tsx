import { getParties } from '@/actions/parties';
import { getMachinery, getFuelTypes } from '@/actions/master';
import { getAccounts } from '@/actions/accounts';
import { MachineryForm } from './MachineryForm';

export default async function AddMachineryPage() {
  const [mach, fuels, parties, accs] = await Promise.all([
    getMachinery(),
    getFuelTypes(),
    getParties(),
    getAccounts(),
  ]);

  const suppliers = parties.filter(p => p.class === 'shop' || p.class === 'supplier');
  const cashProviders = parties.filter(p => p.class === 'person');

  return (
    <MachineryForm 
      initialMachines={mach}
      initialFuelTypes={fuels}
      initialSuppliers={suppliers}
      initialProviders={cashProviders}
      accounts={accs}
    />
  );
}
