import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'monaco-themes/themes': resolve('node_modules/monaco-themes/themes')
    }
  },
  server: {
    open: true,
    port: 9000
  },
  plugins: [sveltekit()]
});
