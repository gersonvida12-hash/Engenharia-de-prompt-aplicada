import { build } from 'vite';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildElectron() {
  try {
    console.log('Building Electron main process...');
    
    // Build main process
    await build({
      configFile: false,
      build: {
        lib: {
          entry: resolve(__dirname, 'main.ts'),
          formats: ['es'],
          fileName: () => 'main.js'
        },
        outDir: resolve(__dirname, '../dist-electron'),
        rollupOptions: {
          external: ['electron']
        },
        emptyOutDir: false,
        minify: false,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
      }
    });

    console.log('Building Electron preload script...');
    
    // Build preload script
    await build({
      configFile: false,
      build: {
        lib: {
          entry: resolve(__dirname, 'preload.ts'),
          formats: ['es'],
          fileName: () => 'preload.mjs'
        },
        outDir: resolve(__dirname, '../dist-electron'),
        rollupOptions: {
          external: ['electron']
        },
        emptyOutDir: false,
        minify: false,
      }
    });

    console.log('Electron build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildElectron();