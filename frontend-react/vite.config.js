import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the deployed Render API so products, profile, settings all work.
// For local cart/wishlist/reviews: run Backend (npm run dev in Backend/) then:
//   VITE_PROXY_TARGET=http://localhost:5000 npm run dev
const proxyTarget = process.env.VITE_PROXY_TARGET || 'https://lavitur.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
