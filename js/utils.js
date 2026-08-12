export const money = n => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(n)||0);
export const qty = n => new Intl.NumberFormat("en-US",{maximumFractionDigits:4}).format(Number(n)||0);
export const today = () => new Date().toISOString().slice(0,10);

export function baseQuantity(quantity, unit, item) {
  const q = Number(quantity) || 0;
  const u = String(unit || "").toLowerCase();
  const base = String(item?.base_unit || "").toLowerCase();
  if (u === base) return q;
  return q * (Number(item?.unit_factor_to_base) || 1);
}

export function unitCost(totalCost, quantityInBase) {
  const q = Number(quantityInBase) || 0;
  return q ? Number(totalCost || 0) / q : 0;
}
