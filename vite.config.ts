import { defineConfig } from 'vite';

// Static-deploy friendly: relative base so the build works from any subpath
// (GitHub Pages, Netlify, plain static hosting) without backend dependencies.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
