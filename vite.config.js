import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Keep Vite's public-file inventory current for newly exported GLBs, while
  // leaving the viewer intact until the author reloads the completed batch.
  plugins: [{name:'manual-blender-model-refresh',hotUpdate({file}) {if(file.replaceAll('\\','/').includes('/public/models/')&&file.endsWith('.glb'))return [];}}],
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/.sites/**','**/.qa/**','**/assets/blender/**'] } },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
