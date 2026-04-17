// ─────────────────────────────────────────────
// Shared utility functions used across routes
// ─────────────────────────────────────────────

/** ISO timestamp for right now */
export const now = () => new Date().toISOString();

/**
 * Find the array index of a category by id.
 * Returns null if not found — callers must check.
 */
export function getCategoryIndex(db, catId) {
  const idx = db.categories.findIndex(c => c.id === catId);
  return idx === -1 ? null : idx;
}

/**
 * Find the array index of a product inside a category object.
 * Returns null if not found.
 */
export function getProductIndex(category, prodId) {
  const idx = category.products.findIndex(p => p.id === prodId);
  return idx === -1 ? null : idx;
}

/**
 * Derive stock status string from a product's current quantities.
 * Returns: 'in_stock' | 'low_stock' | 'out_of_stock'
 */
export function calcStockStatus(product) {
  if (product.type === 'single') {
    const qty       = product.quantity       || 0;
    const threshold = product.lowStockThreshold || 5;
    if (qty === 0)          return 'out_of_stock';
    if (qty <= threshold)   return 'low_stock';
    return 'in_stock';
  }

  // multi
  const qty       = product.unit?.quantity    || 0;
  const threshold = product.lowStockThreshold || 3;
  if (qty === 0)         return 'out_of_stock';
  if (qty <= threshold)  return 'low_stock';
  return 'in_stock';
}

/**
 * Parse a float safely, falling back to 0.
 */
export const toFloat = (v, fallback = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

/**
 * Parse an integer safely, falling back to 0.
 */
export const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
};
