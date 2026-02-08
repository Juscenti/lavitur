// Backend/routes/me.js — authenticated user profile
import express from 'express';
import { verifySupabaseToken } from '../middleware/supabaseAuth.js';
import { getMe, updateMe } from '../controllers/meController.js';

const router = express.Router();
router.use(verifySupabaseToken);
router.get('/', getMe);
router.patch('/', updateMe);
export default router;
