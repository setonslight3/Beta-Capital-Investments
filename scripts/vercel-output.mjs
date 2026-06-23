/**
 * Creates the .vercel/output directory structure (Build Output API v3).
 * This bypasses Vercel's framework detection and outputDirectory resolution,
 * which has proven unreliable for monorepo setups with framework: null.
 *
 * Run this AFTER all builds complete.
 * See: https://vercel.com/docs/build-output-api/v3
 */
import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const STATIC_SRC = resolve(ROOT, 'artifacts/bettercapitalinvestment/dist/public');
const OUTPUT_DIR = resolve(ROOT, '.vercel/output');
const STATIC_DST = resolve(OUTPUT_DIR, 'static');

// Verify the source build output exists
if (!existsSync(STATIC_SRC)) {
  console.error(`ERROR: Build output not found at ${STATIC_SRC}`);
  process.exit(1);
}

// Create output directories
mkdirSync(STATIC_DST, { recursive: true });

// Copy static files
cpSync(STATIC_SRC, STATIC_DST, { recursive: true });
console.log(`✓ Copied static files to ${STATIC_DST}`);

// Build Output API v3 config
const config = {
  version: 3,
  routes: [
    // API routes
    { src: '/api/(.*)', dest: '/api/index' },
    // Static file handling
    { handle: 'filesystem' },
    // SPA fallback - serve index.html for all non-API, non-file routes
    { src: '/(.*)', dest: '/index.html' },
  ],
  overrides: {},
};

writeFileSync(resolve(OUTPUT_DIR, 'config.json'), JSON.stringify(config, null, 2));
console.log('✓ Created .vercel/output/config.json');
console.log('✓ Build Output API v3 structure ready');
