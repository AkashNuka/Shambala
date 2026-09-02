import { getMaterials } from '@/actions/materials';
import { getParties } from '@/actions/parties';
import { getBuildings, getTransportVehicles, getWeighbridges } from '@/actions/master';
import { getAccounts } from '@/actions/accounts';
import { MaterialsForm } from './MaterialsForm';

export default async function AddMaterialPage() {
  const [mats, parts, bldgs, vehs, wbs, accs] = await Promise.all([
    getMaterials(),
    getParties(),
    getBuildings(),
    getTransportVehicles(),
    getWeighbridges(),
    getAccounts(),
  ]);

  const suppliers = parts.filter(p => p.class === 'supplier' || p.class === 'shop');

  return (
    <MaterialsForm 
      initialMaterials={mats}
      initialSuppliers={suppliers}
      initialBuildings={bldgs}
      initialVehicles={vehs}
      initialWeighbridges={wbs}
      accounts={accs}
    />
  );
}
