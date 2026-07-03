import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // same-origin image proxy so we can downscale photos on a canvas without CORS taint
      '/hs': {
        target: 'https://hunter-site.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/hs/, ''),
      },
    },
  },
});
