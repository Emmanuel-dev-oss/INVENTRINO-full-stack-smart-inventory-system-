import express from 'express'

import 
{ getProducts, 
  createSingleProduct,
  createMultiProduct,
  sellSingleProduct,
  updateSingleProduct,
  addStockSingleProduct,
  addStockMultiProduct,
  sellMultiProduct,
  updateMultiProduct,
  deleteProduct,
  getProductHistory
} from '../controllers/product.controller.js'

const router = express.Router({ mergeParams: true })

router.post('/single', createSingleProduct)
router.post('/multi', createMultiProduct);

router.post('/:prodId/sell/single', sellSingleProduct);
router.post('/:prodId/sell/multi', sellMultiProduct);

router.post('/:prodId/addstock/single', addStockSingleProduct);
router.post('/:prodId/addstock/multi', addStockMultiProduct);

router.patch('/:prodId/single', updateSingleProduct);
router.patch('/:prodId/multi', updateMultiProduct);

router.delete('/:prodId', deleteProduct);

router.get('/:prodId/history', getProductHistory);
router.get('/', getProducts)

export default router