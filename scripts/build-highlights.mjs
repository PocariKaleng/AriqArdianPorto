import { build } from 'vite';
import path from 'node:path';
import { projectRoot } from './blog-content.mjs';

export async function buildHighlights() {
  await build({
    configFile: false, root: projectRoot, publicDir: false, logLevel: 'warn',
    resolve: { alias: { '@': projectRoot } },
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: path.join(projectRoot, 'public'), emptyOutDir: false,
      lib: { entry: path.join(projectRoot, 'src/highlights.tsx'), name: 'PortfolioHighlights', formats: ['iife'], fileName: () => 'highlights.js' },
    },
  });
}
