/**
 * Client-side ticket pricing helpers (mirrors backend/utils/pricing.js).
 */

export function calculateDiscountedPrice(
  originalPrice: number | string,
  discountType: string = 'none',
  discountValue: number | string = 0,
): number {
  const base = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice || 0;
  const type = discountType || 'none';
  const value = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue || 0;

  if (base <= 0 || isNaN(base)) return 0;

  if (type === 'percentage' && value > 0 && value <= 100) {
    return Math.round(base * (1 - value / 100) * 100) / 100;
  }
  if (type === 'fixed' && value > 0) {
    return Math.round(Math.max(0, base - value) * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}

export function parseDiscountPercentage(value: string | number): number {
  const pct = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(pct) || pct < 0) return NaN;
  return pct;
}

export function validateDiscountPercentage(value: string | number): string | null {
  if (value === '' || value === null || value === undefined) return null;
  const pct = parseDiscountPercentage(value);
  if (isNaN(pct)) return 'Discount percentage must be a valid number';
  if (pct < 0) return 'Discount percentage cannot be negative';
  if (pct > 100) return 'Discount percentage must be between 0 and 100';
  return null;
}

export function discountFieldsFromPercentage(discountPercentage: string | number) {
  const pct = parseDiscountPercentage(discountPercentage);
  const safe = isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
  return {
    discount_type: safe > 0 ? ('percentage' as const) : ('none' as const),
    discount_value: safe,
  };
}
