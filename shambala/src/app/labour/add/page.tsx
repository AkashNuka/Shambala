import { getParties } from '@/actions/parties';
import { getBuildings, getWorkTypes } from '@/actions/master';
import { getAccounts } from '@/actions/accounts';
import { LabourForm } from './LabourForm';

export default async function AddLabourPage() {
  const [labourParties, investorParties, bldgs, works, accs] = await Promise.all([
    getParties(undefined, 'labour'),
    getParties(undefined, 'investor'),
    getBuildings(),
    getWorkTypes(),
    getAccounts(),
  ]);

  return (
    <LabourForm 
      initialWorkers={labourParties}
      initialProviders={investorParties}
      initialBuildings={bldgs}
      initialWorkTypes={works}
      accounts={accs}
    />
  );
}

