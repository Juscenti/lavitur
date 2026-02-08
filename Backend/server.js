// Backend/server.js — REST API (Supabase backend)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:5501', 'http://127.0.0.1:5501',
    'http://localhost:3000', 'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Public
app.get('/', (req, res) => res.json({ name: 'Lavitúr API', status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);

// Authenticated user (Bearer = Supabase access_token)
app.use('/api/me', meRoutes);

// Admin (Bearer + role admin/representative)
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Lavitúr API running on port ${PORT}`);
});
