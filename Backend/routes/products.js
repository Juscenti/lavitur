// Backend/routes/products.js — public product listing
import express from 'express';
import { listPublicProducts, getOnePublicProduct } from '../controllers/productsController.js';

const router = express.Router();
router.get('/', listPublicProducts);
router.get('/:id', getOnePublicProduct);
export default router;
