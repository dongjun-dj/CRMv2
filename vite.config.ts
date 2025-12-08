import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to remove CDN scripts during build for offline PWA support
const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      return html
        .replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '')
        .replace(/<script>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/, '')
        .replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
    },
  };
};

export default defineConfig({
  plugins: [react(), htmlPlugin()],
  base: './', // CRITICAL: Ensures assets work on GitHub Pages sub-paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});