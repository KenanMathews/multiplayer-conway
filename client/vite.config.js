import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }
          }
        }
      }
    }
  }
});