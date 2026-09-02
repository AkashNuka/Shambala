import { getParties } from '@/actions/parties';
import { getFoodCategories } from '@/actions/master';
import { getAccounts } from '@/actions/accounts';
import { FoodForm } from './FoodForm';

export default async function AddFoodPage() {
  const [categories, parties, accs] = await Promise.all([
    getFoodCategories(),
    getParties(),
    getAccounts(),
  ]);

  const shops = parties.filter(p => p.class === 'shop' || p.class === 'supplier');
  const cashProviders = parties.filter(p => p.class === 'person');

  return (
    <FoodForm 
      initialCategories={categories}
      initialShops={shops}
      initialProviders={cashProviders}
      accounts={accs}
    />
  );
}
