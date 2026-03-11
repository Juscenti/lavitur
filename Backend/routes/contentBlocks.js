// Backend/routes/contentBlocks.js — public storefront (no auth)
import express from 'express';
import { listPublicContentBlocks } from '../controllers/contentBlocksController.js';

const router = express.Router();
router.get('/', listPublicContentBlocks);
export default router;
