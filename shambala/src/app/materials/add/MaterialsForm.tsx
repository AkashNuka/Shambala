'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMaterialVariants, createMaterialDelivery } from '@/actions/materials';
import { SearchableSelect } from '@/components/SearchableSelect';

export function MaterialsForm({
  initialMaterials,
  initialSuppliers,
  initialBuildings,
  initialVehicles,
  initialWeighbridges,
  accounts
}: {
  initialMaterials: any[];
  initialSuppliers: any[];
  initialBuildings: any[];
  initialVehicles: any[];
  initialWeighbridges: any[];
  accounts: any[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [variants, setVariants] = useState<any[]>([]);

  // Delivery State
  const [materialId, setMaterialId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Tonnes');
  const [materialCost, setMaterialCost] = useState('');

  // Transport State
  const [showTransport, setShowTransport] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [transportCost, setTransportCost] = useState('');

  // Weighbridge State
  const [showWeighbridge, setShowWeighbridge] = useState(false);
  const [weighbridgeId, setWeighbridgeId] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [weighbridgeFee, setWeighbridgeFee] = useState('');

  // Account State
  const [accountId, setAccountId] = useState(accounts.length > 0 ? (accounts.find((a: any) => a.is_default)?.id || accounts[0].id) : '');

  // Load variants when material changes
  useEffect(() => {
    if (materialId) {
      getMaterialVariants(materialId).then(setVariants).catch(console.error);
      const mat = initialMaterials.find(m => m.id === materialId);
      if (mat?.default_unit) setUnit(mat.default_unit);
    } else {
      setVariants([]);
    }
  }, [materialId, initialMaterials]);

  const netWeight = (Number(grossWeight) || 0) - (Number(tareWeight) || 0);
  const landedCost = (Number(materialCost) || 0) + (Number(transportCost) || 0) + (Number(weighbridgeFee) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createMaterialDelivery(
        {
          material_id: materialId,
          variant_id: variantId || undefined,
          supplier_id: supplierId || undefined,
          building_id: buildingId || undefined,
          date,
          quantity: quantity ? Number(quantity) : undefined,
          unit,
          material_cost: materialCost ? Number(materialCost) : undefined,
        },
        showTransport ? {
          vehicle_id: vehicleId || undefined,
          amount: transportCost ? Number(transportCost) : undefined,
          account_id: accountId || undefined,
        } : undefined,
        showWeighbridge ? {
          weighbridge_id: weighbridgeId || undefined,
          gross_weight: grossWeight ? Number(grossWeight) : undefined,
          tare_weight: tareWeight ? Number(tareWeight) : undefined,
          fee: weighbridgeFee ? Number(weighbridgeFee) : undefined,
          account_id: accountId || undefined,
        } : undefined,
        accountId || undefined
      );
      router.push('/');
    } catch (err) {
      alert('Failed to save material delivery');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const materialOptions = initialMaterials.map(m => ({ id: m.id, label: m.name }));
  const variantOptions = variants.map(v => ({ id: v.id, label: v.name }));
  const supplierOptions = initialSuppliers.map(s => ({ id: s.id, label: s.name }));
  const buildingOptions = initialBuildings.map(b => ({ id: b.id, label: b.display_name }));
  const vehicleOptions = initialVehicles.map(v => ({ id: v.id, label: v.vehicle_number, subLabel: v.vehicle_type }));
  const weighbridgeOptions = initialWeighbridges.map(w => ({ id: w.id, label: w.name }));
  const accountOptions = accounts.map((a: any) => ({ id: a.id, label: a.name, subLabel: a.type.toUpperCase() }));

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-2xl text-text-secondary active:scale-90 transition-transform">
          ←
        </button>
        <h1 className="text-2xl font-bold">Material Delivery</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Core Material Details */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <SearchableSelect 
            label="Material"
            options={materialOptions}
            value={materialId}
            onChange={setMaterialId}
            placeholder="🔍 Select Material"
          />

          {variants.length > 0 && (
            <SearchableSelect 
               label="Size / Variant"
               options={variantOptions}
               value={variantId}
               onChange={setVariantId}
               placeholder="🔍 Select Size"
            />
          )}

          <SearchableSelect 
            label="Supplier"
            options={supplierOptions}
            value={supplierId}
            onChange={setSupplierId}
            placeholder="🔍 Select Supplier"
          />

          <SearchableSelect 
            label="Destination"
            options={buildingOptions}
            value={buildingId}
            onChange={setBuildingId}
            placeholder="🔍 Select Building"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Quantity/Weight
              </label>
              <input 
                type="number" 
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Unit
              </label>
              <input 
                type="text" 
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Material Cost (Optional)
            </label>
            <input 
              type="number" 
              value={materialCost}
              onChange={e => setMaterialCost(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent text-xl font-bold"
              placeholder="₹0.00"
            />
          </div>
        </div>

        {/* Transport Link */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
          {!showTransport ? (
            <button 
              type="button"
              onClick={() => setShowTransport(true)}
              className="w-full text-accent font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> Add Transport Record
            </button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-text">Transport Details</h3>
                <button type="button" onClick={() => setShowTransport(false)} className="text-text-muted text-sm">Remove</button>
              </div>
              <SearchableSelect 
                label="Vehicle"
                options={vehicleOptions}
                value={vehicleId}
                onChange={setVehicleId}
                placeholder="🔍 Select Vehicle"
              />
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Transport Cost
                </label>
                <input 
                  type="number" 
                  value={transportCost}
                  onChange={e => setTransportCost(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                  placeholder="₹0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Weighbridge Link */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
          {!showWeighbridge ? (
            <button 
              type="button"
              onClick={() => setShowWeighbridge(true)}
              className="w-full text-accent font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> Add Weighbridge Record
            </button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-text">Weighbridge Details</h3>
                <button type="button" onClick={() => setShowWeighbridge(false)} className="text-text-muted text-sm">Remove</button>
              </div>
              
              <SearchableSelect 
                label="Weighbridge Location"
                options={weighbridgeOptions}
                value={weighbridgeId}
                onChange={setWeighbridgeId}
                placeholder="🔍 Select Weighbridge"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Gross
                  </label>
                  <input 
                    type="number" 
                    value={grossWeight}
                    onChange={e => setGrossWeight(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Tare
                  </label>
                  <input 
                    type="number" 
                    value={tareWeight}
                    onChange={e => setTareWeight(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1 bg-bg-elevated rounded-lg p-2 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-text-muted uppercase font-semibold">Net</span>
                  <span className="font-bold text-accent">{netWeight > 0 ? netWeight : 0}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Weighbridge Fee
                </label>
                <input 
                  type="number" 
                  value={weighbridgeFee}
                  onChange={e => setWeighbridgeFee(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-accent"
                  placeholder="₹0.00"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <SearchableSelect 
            label="Paid From Account"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="🔍 Select Account"
          />
        </div>

        {/* Cost Summary */}
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Total Landed Cost</p>
            {quantity && netWeight > 0 && (
              <p className="text-xs text-text-muted mt-0.5">₹{(landedCost / netWeight).toFixed(2)} / unit</p>
            )}
          </div>
          <div className="text-2xl font-bold text-accent">
            ₹{landedCost.toFixed(2)}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving || !materialId}
          className="block w-full py-4 bg-accent text-white text-center text-lg font-bold rounded-2xl shadow-glow-accent hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
        >
          {saving ? 'Saving...' : 'SAVE DELIVERY'}
        </button>
      </form>
    </div>
  );
}
