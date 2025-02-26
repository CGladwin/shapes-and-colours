import { defineConfig } from 'vite';
import dotenv from 'dotenv'
import react from '@vitejs/plugin-react';

dotenv.config()

export default defineConfig({
  envDir: "./env",
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
      },
    },
  },
});