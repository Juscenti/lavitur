// Backend/routes/products.js — public product listing
import express from 'express';
import { listPublicProducts } from '../controllers/productsController.js';

const router = express.Router();
router.get('/', listPublicProducts);
export default router;
