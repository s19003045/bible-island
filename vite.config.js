import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/.sites/**','**/.qa/**','**/assets/blender/**','**/public/models/**'] } },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
