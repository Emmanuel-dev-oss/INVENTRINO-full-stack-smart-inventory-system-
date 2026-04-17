import * as ProductService from '../services/product.service.js'

// POST Create Category
export const createCategory = (req, res) => {
    try {
        const {name} = req.body;

        const category = ProductService.createCategoryService(name);
        
       return res.status(201).json({
            success: true,
            data: category
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// GET Category
export const getAllCategories = (_req, res) => {
  try {
    const data = ProductService.getAllCategoriesService();

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE category
export const deleteCategory = (req, res) => {
  try {
    const catId = req.params.catId;

    ProductService.deleteCategoryService(catId);

    return res.json({
      success: true,
      message: 'Category deleted'
    });

  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update Category Title
export const updateCategory = (req, res) => {
  try {
    const { catId } = req.params;

    const updatedCategory = ProductService.updateCategoryService(catId, req.body);

    return res.json({
      success: true,
      data: updatedCategory
    });

  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Creating Single Product to Category
export const createSingleProduct = (req, res) => {
  try {
    const {catId}  = req.params;
    const body = req.body;

    console.log("catId:", req.params.catId);

    const product = ProductService.createSingleProductService(catId, body);

    if (!catId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is missing'
      });
    }

    return res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Create Multiple Product
export const createMultiProduct = (req, res) => {
  try {
    const { catId } = req.params;

    if (!catId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const product = ProductService.createMultiProductService(catId, req.body);

    return res.status(201).json({
      success: true,
      data: product
    });

  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get product from category
export const getProducts = (req, res) => {
  try {
    const { catId } = req.params;

    const result = ProductService.getProductsService(catId, req.query);

    return res.json({
      success: true,
      ...result
    });

  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Sell Single product
export const sellSingleProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.sellSingleProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result.product,
      sale: result.sale
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Sell Multiple Product
export const sellMultiProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.sellMultiProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result.product,
      sale: result.sale
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Edit or Update Single Product
export const updateSingleProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.updateSingleProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Edit or Update Multiple Product
export const updateMultiProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.updateMultiProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add Stock to Single Product
export const addStockSingleProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.addStockSingleProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add Stock to Multiple Product
export const addStockMultiProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.addStockMultiProductService(catId, prodId, req.body);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Product
export const deleteProduct = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.deleteProductService(catId, prodId);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      message: result.message,
      data: result.deletedProduct
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Product History
export const getProductHistory = (req, res) => {
  try {
    const { catId, prodId } = req.params;

    if (!catId || !prodId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Product ID are required'
      });
    }

    const result = ProductService.getProductHistoryService(catId, prodId);

    if (result?.error === 'Category not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    if (result?.error === 'Product not found') {
      return res.status(404).json({ success: false, message: result.error });
    }

    return res.json({
      success: true,
      data: result.history,
      product: result.product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};