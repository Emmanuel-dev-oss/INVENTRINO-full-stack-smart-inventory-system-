import * as Product from '../models/product.model.js'
import { convertToBaseUnit } from '../utils/unit.util.js'

import { v4 as uuidv4 } from 'uuid';
import {
  now,
  getCategoryIndex,
  getProductIndex,
  calcStockStatus,
  toFloat,
  toInt,
} from '../library/helpers.js';

// Create Category
export const createCategoryService = (name) => {
    if (!name || !name.trim()) {
        throw new Error('Category name is required');
    } 

    const category = {
        id: uuidv4(),
        name: name.trim(),
        heading: name.trim(),
        createdAt: now(),
        products: [],
    };

    return Product.createCategoryModel(category);
}

// Get Category
export const getAllCategoriesService = () => {
  const categories = Product.getAllCategoriesModel();

  return categories.map(({ id, name, heading, createdAt, products }) => ({
    id,
    name,
    heading: heading || name,
    createdAt,
    productCount: products.length,
  }));
};

// Delete Category
export const deleteCategoryService = (catId) => {
  if (!catId) {
    throw new Error('Category ID is required');
  }

  const deleted = Product.deleteCategoryModel(catId);

  if (!deleted) {
    throw new Error('Category not found');
  }

  return true;
};

// Update Category Heading
export const updateCategoryService = (catId, data) => {
  if (!catId) {
    throw new Error('Category ID is required');
  }

  if (data.name !== undefined && !data.name.trim()) {
    throw new Error('Name cannot be empty');
  }

  if (data.heading !== undefined && !data.heading.trim()) {
    throw new Error('Heading cannot be empty');
  }

  const updated = Product.updateCategoryModel(catId, data);

  if (!updated) {
    throw new Error('Category not found');
  }

  return updated;
};

// Creating single product 
export const createSingleProductService = (catId, body) => {
  const {
    productName,
    price,
    quantity,
    eachCostPrice,
    totalCostPrice,
    eachSellingPrice,
    totalSellingPrice,
    lowStockThreshold,
  } = body;

  // ✅ VALIDATION
  if (!productName || !productName.trim()) {
    throw new Error('Product name is required');
  }

  // 🧠 CREATE PRODUCT OBJECT
  const product = {
    id: uuidv4(),
    type: 'single',
    productName: productName.trim(),
    price: toFloat(price),
    quantity: toInt(quantity),
    eachCostPrice: toFloat(eachCostPrice),
    totalCostPrice: toFloat(totalCostPrice),
    eachSellingPrice: toFloat(eachSellingPrice),
    totalSellingPrice: toFloat(totalSellingPrice),
    lowStockThreshold: toInt(lowStockThreshold, 5),
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    createdAt: now(),
    updatedAt: now(),
    salesHistory: [],
  };

  const created = Product.createSingleProductModel(catId, product);

  if (!created) {
    throw new Error('Category not found');
  }

  return {
    ...created,
    stockStatus: calcStockStatus(created)
  };
};

// Create Multiple products
export const createMultiProductService = (catId, body) => {
  const { productName, unit, baseUnit, lowStockThreshold } = body;

  // ✅ VALIDATION
  if (!productName || !productName.trim()) {
    throw new Error('Product name is required');
  }

  if (!unit?.name) {
    throw new Error('Unit info is required');
  }

  if (!baseUnit?.name) {
    throw new Error('Base unit info is required');
  }

  // 🔢 CALCULATIONS
  const unitQty  = toInt(unit.quantity);
  const convRate = toFloat(baseUnit.conversionRate, 1);
  const ecp      = toFloat(unit.eachCostPrice);
  const esp      = toFloat(unit.eachSellingPrice);

  const product = {
    id: uuidv4(),
    type: 'multi',
    productName: productName.trim(),
    lowStockThreshold: toInt(lowStockThreshold, 3),

    unit: {
      name: unit.name.trim(),
      quantity: unitQty,
      eachCostPrice: ecp,
      eachSellingPrice: esp,
      totalCostPrice: toFloat(unit.totalCostPrice, ecp * unitQty),
      totalSellingPrice: toFloat(unit.totalSellingPrice, esp * unitQty),
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
    },

    baseUnit: {
      name: baseUnit.name.trim(),
      conversionRate: convRate,
      totalQuantity: toFloat(baseUnit.totalQuantity, convRate * unitQty),
      costPrice: toFloat(baseUnit.costPrice, convRate > 0 ? ecp / convRate : 0),
      sellingPrice: toFloat(baseUnit.sellingPrice, convRate > 0 ? esp / convRate : 0),
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
    },

    totalProfit: 0,
    createdAt: now(),
    updatedAt: now(),
    salesHistory: [],
  };

  const created = Product.createMultiProductModel(catId, product);

  if (!created) {
    throw new Error('Category not found');
  }

  return {
    ...created,
    stockStatus: calcStockStatus(created),
  };
};

// ─────────────────────────────────────────────
// GET /api/categories/:catId/products
// Paginated + searchable product list
// ─────────────────────────────────────────────
export const getProductsService = (catId, query) => {
  const { page = 1, limit = 5, search = '' } = query;

  let products = Product.getProductsByCategoryModel(catId);

  if (!products) {
    throw new Error('Category not found');
  }

  // 🔍 SEARCH
  const q = search.trim().toLowerCase();

  if (q) {
    products = products.filter(p => {
      const names = [
        p.productName ?? '',
        p.type === 'multi' ? (p.unit?.name ?? '') : '',
        p.type === 'multi' ? (p.baseUnit?.name ?? '') : '',
      ];

      return names.some(n => n.toLowerCase().includes(q));
    });
  }

  // 📊 PAGINATION
  const total = products.length;
  const limitNum = Math.max(1, toInt(limit, 5));
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const safePage = Math.min(Math.max(1, toInt(page, 1)), totalPages);

  const start = (safePage - 1) * limitNum;
  const paginated = products.slice(start, start + limitNum);

  // ⚠️ ADD STOCK STATUS
  const data = paginated.map(p => ({
    ...p,
    stockStatus: calcStockStatus(p)
  }));

  return {
    data,
    pagination: {
      page: safePage,
      limit: limitNum,
      total,
      totalPages
    }
  };
};

// Sell Single Product Service
export const sellSingleProductService = (catId, prodId, body) => {
  return Product.sellSingleProductModel(catId, prodId, (p) => {

    if (p.type !== 'single') {
      throw new Error('Wrong product type');
    }

    const qty = toInt(body.quantity, 1);
    const sPrice = toFloat(body.sellingPrice, p.eachSellingPrice);

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (qty > p.quantity) {
      throw new Error(`Insufficient stock. Only ${p.quantity} unit(s) available.`);
    }

    // 💰 CALCULATIONS
    const revenue = qty * sPrice;
    const cost = qty * p.eachCostPrice;
    const profit = revenue - cost;

    // 📉 UPDATE STOCK
    p.quantity -= qty;
    p.totalSold += qty;
    p.totalRevenue += revenue;
    p.totalProfit += profit;
    p.totalCostPrice = p.quantity * p.eachCostPrice;
    p.totalSellingPrice = p.quantity * p.eachSellingPrice;
    p.updatedAt = now();

    // 🧾 HISTORY
    const histEntry = {
      id: uuidv4(),
      type: 'sale',
      quantity: qty,
      priceEach: sPrice,
      revenue,
      cost,
      profit,
      profitType: profit >= 0 ? 'profit' : 'loss',
      qtyAfter: p.quantity,
      date: now(),
    };

    p.salesHistory.unshift(histEntry);

    return {
      product: { ...p, stockStatus: calcStockStatus(p) },
      sale: histEntry
    };
  });
};

// Sell Multiple Product Service
export const sellMultiProductService = (catId, prodId, body) => {
  return Product.sellMultiProductModel(catId, prodId, (p) => {

    if (p.type !== 'multi') {
      throw new Error('Wrong product type');
    }

    const { sellFrom } = body;
    const qty = toInt(body.quantity, 1);

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    let histEntry;

    // 🔹 SELL FROM UNIT
    if (sellFrom === 'unit') {
      const sPrice = toFloat(body.sellingPrice, p.unit.eachSellingPrice);

      if (qty > p.unit.quantity) {
        throw new Error(`Only ${p.unit.quantity} ${p.unit.name}(s) in stock.`);
      }

      const revenue = qty * sPrice;
      const cost = qty * p.unit.eachCostPrice;
      const profit = revenue - cost;

      // Update unit
      p.unit.quantity -= qty;
      p.unit.totalSold += qty;
      p.unit.totalRevenue += revenue;
      p.unit.totalProfit += profit;
      p.unit.totalCostPrice = p.unit.quantity * p.unit.eachCostPrice;
      p.unit.totalSellingPrice = p.unit.quantity * p.unit.eachSellingPrice;

      // Sync base
      p.baseUnit.totalQuantity = p.unit.quantity * p.baseUnit.conversionRate;

      p.totalProfit += profit;

      histEntry = {
        id: uuidv4(),
        type: 'sale',
        sellFrom: 'unit',
        unitName: p.unit.name,
        quantity: qty,
        priceEach: sPrice,
        revenue,
        cost,
        profit,
        profitType: profit >= 0 ? 'profit' : 'loss',
        unitQtyAfter: p.unit.quantity,
        baseQtyAfter: p.baseUnit.totalQuantity,
        date: now(),
      };

    } 
    // 🔹 SELL FROM BASE
    else if (sellFrom === 'base') {
      const sPrice = toFloat(body.sellingPrice, p.baseUnit.sellingPrice);

      if (qty > p.baseUnit.totalQuantity) {
        throw new Error(`Only ${p.baseUnit.totalQuantity} ${p.baseUnit.name}(s) in stock.`);
      }

      const revenue = qty * sPrice;
      const cost = qty * p.baseUnit.costPrice;
      const profit = revenue - cost;

      // Update base
      p.baseUnit.totalQuantity -= qty;
      p.baseUnit.totalSold += qty;
      p.baseUnit.totalRevenue += revenue;
      p.baseUnit.totalProfit += profit;

      // Sync unit
      p.unit.quantity = Math.floor(
        p.baseUnit.totalQuantity / p.baseUnit.conversionRate
      );

      p.unit.totalCostPrice = p.unit.quantity * p.unit.eachCostPrice;
      p.unit.totalSellingPrice = p.unit.quantity * p.unit.eachSellingPrice;

      p.totalProfit += profit;

      histEntry = {
        id: uuidv4(),
        type: 'sale',
        sellFrom: 'base',
        unitName: p.baseUnit.name,
        quantity: qty,
        priceEach: sPrice,
        revenue,
        cost,
        profit,
        profitType: profit >= 0 ? 'profit' : 'loss',
        unitQtyAfter: p.unit.quantity,
        baseQtyAfter: p.baseUnit.totalQuantity,
        date: now(),
      };
    } else {
      throw new Error('sellFrom must be "unit" or "base"');
    }

    p.updatedAt = now();
    p.salesHistory.unshift(histEntry);

    return {
      product: { ...p, stockStatus: calcStockStatus(p) },
      sale: histEntry
    };
  });
};

// Edit or Signle Product Service
export const updateSingleProductService = (catId, prodId, body) => {
  return Product.updateSingleProductModel(catId, prodId, (p) => {

    if (p.type !== 'single') {
      throw new Error('Product is not single type');
    }

    const stringFields = ['productName'];
    const intFields    = ['quantity', 'lowStockThreshold'];
    const floatFields  = [
      'price',
      'eachCostPrice',
      'totalCostPrice',
      'eachSellingPrice',
      'totalSellingPrice'
    ];

    // 🧠 APPLY PARTIAL UPDATES
    for (const f of stringFields) {
      if (body[f] !== undefined) p[f] = body[f].trim();
    }

    for (const f of intFields) {
      if (body[f] !== undefined) p[f] = toInt(body[f]);
    }

    for (const f of floatFields) {
      if (body[f] !== undefined) p[f] = toFloat(body[f]);
    }

    p.updatedAt = now();

    // 🧾 AUDIT LOG
    p.salesHistory.unshift({
      id: uuidv4(),
      type: 'edit',
      note: 'Product details updated',
      date: now(),
    });

    return {
      ...p,
      stockStatus: calcStockStatus(p)
    };
  });
};

// Edit or Multiple Product Service
export const updateMultiProductService = (catId, prodId, body) => {
  return Product.updateMultiProductModel(catId, prodId, (p) => {

    if (p.type !== 'multi') {
      throw new Error('Product is not multi type');
    }

    // 🔹 BASIC FIELDS
    if (body.productName !== undefined) {
      p.productName = body.productName.trim();
    }

    if (body.lowStockThreshold !== undefined) {
      p.lowStockThreshold = toInt(body.lowStockThreshold);
    }

    // 🔹 UNIT UPDATE
    if (body.unit) {
      for (const [k, v] of Object.entries(body.unit)) {
        p.unit[k] = k === 'name' ? String(v).trim() : toFloat(v);
      }
    }

    // 🔹 BASE UNIT UPDATE
    if (body.baseUnit) {
      for (const [k, v] of Object.entries(body.baseUnit)) {
        p.baseUnit[k] = k === 'name' ? String(v).trim() : toFloat(v);
      }
    }

    // 🔁 CRITICAL: Re-sync values after update
    if (p.baseUnit.conversionRate > 0) {
      p.baseUnit.totalQuantity = p.unit.quantity * p.baseUnit.conversionRate;
    }

    p.unit.totalCostPrice =
      p.unit.quantity * p.unit.eachCostPrice;

    p.unit.totalSellingPrice =
      p.unit.quantity * p.unit.eachSellingPrice;

    p.updatedAt = now();

    // 🧾 AUDIT LOG
    p.salesHistory.unshift({
      id: uuidv4(),
      type: 'edit',
      note: 'Product details updated',
      date: now(),
    });

    return {
      ...p,
      stockStatus: calcStockStatus(p)
    };
  });
};

// Add Stock for Single Product
export const addStockSingleProductService = (catId, prodId, body) => {
  return Product.addStockSingleProductModel(catId, prodId, (p) => {

    if (p.type !== 'single') {
      throw new Error('Product is not single type');
    }

    const qty = toInt(body.quantity);

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const { eachCostPrice, eachSellingPrice } = body;

    // 📦 UPDATE STOCK
    p.quantity += qty;

    if (eachCostPrice !== undefined) {
      p.eachCostPrice = toFloat(eachCostPrice);
    }

    if (eachSellingPrice !== undefined) {
      p.eachSellingPrice = toFloat(eachSellingPrice);
    }

    p.totalCostPrice = p.quantity * p.eachCostPrice;
    p.totalSellingPrice = p.quantity * p.eachSellingPrice;
    p.updatedAt = now();

    // 🧾 HISTORY
    p.salesHistory.unshift({
      id: uuidv4(),
      type: 'restock',
      quantity: qty,
      note: `Added ${qty} unit(s) to stock`,
      date: now(),
    });

    return {
      ...p,
      stockStatus: calcStockStatus(p)
    };
  });
};

// Add Stock for Multiple Product
export const addStockMultiProductService = (catId, prodId, body) => {
  return Product.addStockMultiProductModel(catId, prodId, (p) => {

    if (p.type !== 'multi') {
      throw new Error('Product is not multi type');
    }

    const { addFrom, eachCostPrice, eachSellingPrice, costPrice, sellingPrice } = body;
    const qty = toInt(body.quantity);

    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (!['unit', 'base'].includes(addFrom)) {
      throw new Error('addFrom must be either "unit" or "base"');
    }

    // 🔄 UNIT RESTOCK
    if (addFrom === 'unit') {
      p.unit.quantity += qty;

      if (eachCostPrice !== undefined) {
        p.unit.eachCostPrice = toFloat(eachCostPrice);
      }

      if (eachSellingPrice !== undefined) {
        p.unit.eachSellingPrice = toFloat(eachSellingPrice);
      }

      p.unit.totalCostPrice = p.unit.quantity * p.unit.eachCostPrice;
      p.unit.totalSellingPrice = p.unit.quantity * p.unit.eachSellingPrice;

      // 🔁 Sync base
      p.baseUnit.totalQuantity = p.unit.quantity * p.baseUnit.conversionRate;

      p.salesHistory.unshift({
        id: uuidv4(),
        type: 'restock',
        addFrom: 'unit',
        quantity: qty,
        note: `Added ${qty} ${p.unit.name}(s) to stock`,
        date: now(),
      });

    } else {
      // 🔄 BASE RESTOCK
      p.baseUnit.totalQuantity += qty;

      if (costPrice !== undefined) {
        p.baseUnit.costPrice = toFloat(costPrice);
      }

      if (sellingPrice !== undefined) {
        p.baseUnit.sellingPrice = toFloat(sellingPrice);
      }

      // 🔁 Sync unit
      p.unit.quantity = Math.floor(
        p.baseUnit.totalQuantity / p.baseUnit.conversionRate
      );

      p.unit.totalCostPrice = p.unit.quantity * p.unit.eachCostPrice;
      p.unit.totalSellingPrice = p.unit.quantity * p.unit.eachSellingPrice;

      p.salesHistory.unshift({
        id: uuidv4(),
        type: 'restock',
        addFrom: 'base',
        quantity: qty,
        note: `Added ${qty} ${p.baseUnit.name}(s) to stock`,
        date: now(),
      });
    }

    p.updatedAt = now();

    return {
      ...p,
      stockStatus: calcStockStatus(p)
    };
  });
};

// Delete Products
export const deleteProductService = (catId, prodId) => {
  const result = Product.deleteProductModel(catId, prodId);

  if (result?.error) {
    return result;
  }

  return {
    message: 'Product deleted successfully',
    deletedProduct: result
  };
};

// Get Product History
export const getProductHistoryService = (catId, prodId) => {
  const result = Product.getProductHistoryModel(catId, prodId);

  if (result?.error) {
    return result;
  }

  // Optional: sort latest first (if not already)
  const sortedHistory = [...result.salesHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return {
    product: {
      id: result.id,
      productName: result.productName,
      type: result.type,
    },
    history: sortedHistory
  };
};


