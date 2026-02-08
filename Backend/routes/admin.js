// Backend/routes/admin.js — admin-only routes (Supabase JWT + role check)
import express from 'express';
import multer from 'multer';
import { verifySupabaseToken, requireAdmin } from '../middleware/supabaseAuth.js';
import * as adminUsers from '../controllers/adminUsersController.js';
import * as adminOrders from '../controllers/adminOrdersController.js';
import * as adminDashboard from '../controllers/adminDashboardController.js';
import * as adminDiscounts from '../controllers/adminDiscountsController.js';
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  listProductMedia,
  uploadProductMedia,
  deleteProductMedia,
  setPrimaryMedia,
} from '../controllers/productsController.js';

const router = express.Router();

// All admin routes require valid Supabase token and admin/representative role
router.use(verifySupabaseToken);
router.use(requireAdmin);

// Users
router.get('/users', adminUsers.listUsers);
router.get('/users/:id', adminUsers.getUser);
router.patch('/users/:id/status', adminUsers.updateUserStatus);
router.patch('/users/:id/role', adminUsers.updateUserRole);

// Products
router.get('/products', listAdminProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.patch('/products/:id/status', updateProductStatus);
router.delete('/products/:id', deleteProduct);

// Product media (multer memory storage for multipart)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.get('/products/:id/media', listProductMedia);
router.post('/products/:id/media', upload.array('files', 10), uploadProductMedia);
router.delete('/products/:id/media/:mediaId', deleteProductMedia);
router.patch('/products/:id/media/:mediaId/primary', setPrimaryMedia);

// Orders
router.get('/orders', adminOrders.listOrders);
router.patch('/orders/:id/status', adminOrders.updateOrderStatus);

// Dashboard
router.get('/dashboard', adminDashboard.getMetrics);

// Discounts
router.get('/discounts', adminDiscounts.listDiscounts);
router.post('/discounts', adminDiscounts.createDiscount);
router.patch('/discounts/:id/active', adminDiscounts.updateDiscountActive);

export default router;
