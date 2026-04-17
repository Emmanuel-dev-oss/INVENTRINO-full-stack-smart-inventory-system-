import { readDB, writeDB } from '../library/db.js';
import { getCategoryIndex, getProductIndex } from '../library/helpers.js';

// Create Category Model
export const createCategoryModel = (categoryData) => {
  const db = readDB();

  db.categories.push(categoryData);

  writeDB(db);

  return categoryData;
}

// Get all Cateegory Model
export const getAllCategoriesModel = () => {
  const db = readDB();
  return db.categories;
};

// Delete Category
export const deleteCategoryModel = (catId) => {
  const db = readDB();

  const idx = getCategoryIndex(db, catId);
  if (idx === null) return null;

  db.categories.splice(idx, 1);
  writeDB(db);

  return true;
};

// Update Category Heading
export const updateCategoryModel = (catId, updates) => {
  const db = readDB();

  const idx = getCategoryIndex(db, catId);
  if (idx === null) return null;

  const category = db.categories[idx];

  if (updates.heading !== undefined) {
    category.heading = updates.heading.trim();
  }

  if (updates.name !== undefined) {
    category.name = updates.name.trim();
  }

  writeDB(db);

  return category;
};

// Creating Single Product Modals
export const createSingleProductModel = (catId, product) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return null;

  db.categories[catIdx].products.push(product);

  writeDB(db);

  return product;
};

// Create Multiple Product
export const createMultiProductModel = (catId, product) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return null;

  db.categories[catIdx].products.push(product);

  writeDB(db);

  return product;
};

// Get products by category
export const getProductsByCategoryModel = (catId) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return null;

  return db.categories[catIdx].products;
};

// Sell Single Products
export const sellSingleProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  // Let service control mutation
  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Sell Multiple Products
export const sellMultiProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Edit or Update Single Product
export const updateSingleProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Edit or Update Multiple Product
export const updateMultiProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Add Stock Model for Single Product
export const addStockSingleProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Add Stock Model for Multiple Product
export const addStockMultiProductModel = (catId, prodId, updateFn) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  const result = updateFn(product);

  writeDB(db);

  return result;
};

// Delete Products
export const deleteProductModel = (catId, prodId) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const [removed] = db.categories[catIdx].products.splice(prodIdx, 1);

  writeDB(db);

  return removed;
};

// Get Product History
export const getProductHistoryModel = (catId, prodId) => {
  const db = readDB();

  const catIdx = getCategoryIndex(db, catId);
  if (catIdx === null) return { error: 'Category not found' };

  const prodIdx = getProductIndex(db.categories[catIdx], prodId);
  if (prodIdx === null) return { error: 'Product not found' };

  const product = db.categories[catIdx].products[prodIdx];

  return {
    id: product.id,
    productName: product.productName,
    type: product.type,
    salesHistory: product.salesHistory || []
  };
};








