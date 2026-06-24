import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Dynamically import the Express app to avoid ERR_REQUIRE_ESM in CommonJS context
  // @ts-ignore
  const { app } = await import('../artifacts/api-server/dist/index.mjs');
  
  // Vercel provides req and res objects compatible with Express
  // We just pass them through to the Express app
  return app(req, res);
}
