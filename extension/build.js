import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBuild() {
  console.log('🚀 Starting FormAssist Extension build...');
  const outDir = path.resolve(__dirname, 'dist');
  const srcDir = path.resolve(__dirname, 'src');

  // Clean dist
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Build HTML Entry Points (popup, onboarding, options)
  console.log('📦 [1/3] Building HTML UI pages (popup, onboarding, options)...');
  await build({
    configFile: false,
    root: srcDir,
    plugins: [react()],
    base: './',
    resolve: {
      alias: { '@': srcDir },
    },
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: path.resolve(srcDir, 'popup/index.html'),
          onboarding: path.resolve(srcDir, 'onboarding/index.html'),
          options: path.resolve(srcDir, 'options/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  });

  // 2. Build Background Service Worker (ESM)
  console.log('⚙️ [2/3] Building Background Service Worker...');
  await build({
    configFile: false,
    plugins: [],
    resolve: {
      alias: { '@': srcDir },
    },
    build: {
      outDir: path.resolve(outDir, 'background'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(srcDir, 'background/service-worker.ts'),
        formats: ['es'],
        fileName: () => 'service-worker.js',
      },
      rollupOptions: {
        output: {
          format: 'es',
          inlineDynamicImports: true,
        },
      },
    },
  });

  // 3. Build Content Script (IIFE - self-contained)
  console.log('💉 [3/3] Building Content Script & Overlay...');
  await build({
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: { '@': srcDir },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: path.resolve(outDir, 'content'),
      emptyOutDir: false,
      lib: {
        entry: path.resolve(srcDir, 'content/content-script.tsx'),
        formats: ['iife'],
        name: 'FormAssistContentScript',
        fileName: () => 'content-script.js',
      },
      rollupOptions: {
        output: {
          format: 'iife',
          inlineDynamicImports: true,
        },
      },
    },
  });

  // Copy manifest and icons from public/ to dist/
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('📋 Copying manifest & public assets...');
    fs.cpSync(publicDir, outDir, { recursive: true });
  }

  // Copy bundled fonts to dist/assets/fonts
  const fontsSrc = path.resolve(srcDir, 'assets/fonts');
  const fontsDist = path.resolve(outDir, 'assets/fonts');
  if (fs.existsSync(fontsSrc)) {
    fs.mkdirSync(fontsDist, { recursive: true });
    fs.cpSync(fontsSrc, fontsDist, { recursive: true });
    console.log('🔤 Copied fonts to dist/assets/fonts');
  }

  console.log('✅ FormAssist Extension build complete!');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
