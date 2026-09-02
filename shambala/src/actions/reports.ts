'use server';

import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROJECT_ID } from '@/lib/constants';

export interface ModuleSpend {
  module: string;
  label: string;
  icon: string;
  total: number;
}

export async function getMonthlyReport(year: number, month: number): Promise<{ modules: ModuleSpend[]; grandTotal: number }> {
  const supabase = await createClient();

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toLocaleDateString('en-CA');

  // Fetch all record types for the month in parallel
  const [labourRes, foodRes, machineryRes, salaryRes, materialRes, transportRes] = await Promise.all([
    supabase
      .from('labour_records')
      .select('amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('amount', 'is', null),
    supabase
      .from('food_records')
      .select('amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('start_date', firstDay)
      .lte('start_date', lastDay)
      .not('amount', 'is', null),
    supabase
      .from('machinery_records')
      .select('amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('amount', 'is', null),
    supabase
      .from('salary_records')
      .select('amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('payment_date', firstDay)
      .lte('payment_date', lastDay),
    supabase
      .from('material_deliveries')
      .select('material_cost')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('material_cost', 'is', null),
    supabase
      .from('transport_trips')
      .select('*, vehicle:transport_vehicles(vehicle_number), delivery:material_deliveries(project_id, date)')
      .eq('status', 'completed'),
    // Note: transport_trips link through material_deliveries for project/date context.
    // We filter after fetch since Supabase nested filters have limitations.
  ]);

  const sum = (rows: any[] | null, field = 'amount') =>
    (rows || []).reduce((s: number, r: any) => s + (Number(r[field]) || 0), 0);

  // Filter transport records by project and date range via joined delivery
  const filteredTransport = (transportRes.data || []).filter((r: any) => {
    const delivery = r.delivery as any;
    if (!delivery) return false;
    return delivery.project_id === DEFAULT_PROJECT_ID &&
           delivery.date >= firstDay &&
           delivery.date <= lastDay;
  });

  const modules: ModuleSpend[] = [
    { module: 'labour', label: 'Labour', icon: '👷', total: sum(labourRes.data) },
    { module: 'food', label: 'Food & Groceries', icon: '🍚', total: sum(foodRes.data) },
    { module: 'machinery', label: 'Machinery', icon: '🚜', total: sum(machineryRes.data) },
    { module: 'salary', label: 'Salary', icon: '💰', total: sum(salaryRes.data) },
    { module: 'materials', label: 'Materials', icon: '🧱', total: sum(materialRes.data, 'material_cost') },
    { module: 'transport', label: 'Transport', icon: '🚚', total: sum(filteredTransport) },
  ];

  const grandTotal = modules.reduce((s, m) => s + m.total, 0);

  return { modules, grandTotal };
}

export async function getDayBook(date: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*, party:parties(name), account:accounts(name)')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBuildingReport(year: number, month: number) {
  const supabase = await createClient();

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toLocaleDateString('en-CA');

  const [buildingsRes, labourRes, materialRes, machineryRes] = await Promise.all([
    supabase.from('buildings').select('id, display_name').eq('project_id', DEFAULT_PROJECT_ID),
    supabase
      .from('labour_records')
      .select('building_id, amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('amount', 'is', null)
      .not('building_id', 'is', null),
    supabase
      .from('material_deliveries')
      .select('building_id, material_cost')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('material_cost', 'is', null)
      .not('building_id', 'is', null),
    supabase
      .from('machinery_records')
      .select('building_id, amount')
      .eq('project_id', DEFAULT_PROJECT_ID)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .not('amount', 'is', null)
      .not('building_id', 'is', null)
  ]);

  const buildings = buildingsRes.data || [];
  const labour = labourRes.data || [];
  const materials = materialRes.data || [];
  const machinery = machineryRes.data || [];

  const buildingCosts = buildings.map((b: any) => {
    const lCost = labour.filter((r: any) => r.building_id === b.id).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
    const mCost = materials.filter((r: any) => r.building_id === b.id).reduce((s: number, r: any) => s + (Number(r.material_cost) || 0), 0);
    const machCost = machinery.filter((r: any) => r.building_id === b.id).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

    return {
      id: b.id,
      name: b.display_name,
      total: lCost + mCost + machCost,
      breakdown: {
        labour: lCost,
        materials: mCost,
        machinery: machCost
      }
    };
  }).filter((b: any) => b.total > 0);

  buildingCosts.sort((a: any, b: any) => b.total - a.total);

  return buildingCosts;
}
