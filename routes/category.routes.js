import express from 'express'
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/product.controller.js'

const router = express.Router()

// Filter and Query routes
router.get('/', getAllCategories)


// Dynamic params routes(Generic)
router.delete('/:catId', deleteCategory);
router.patch('/:catId', updateCategory);

// Create
router.post('/', createCategory)

export default router