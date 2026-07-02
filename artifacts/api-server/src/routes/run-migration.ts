/**
 * ONE-TIME MIGRATION ENDPOINT
 * Access: http://localhost:3000/api/run-migration
 * Delete this file after running
 */

import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/run-migration", async (_req: Request, res: Response) => {
  try {
    // Step 1: Add column
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'payments' 
              AND column_name = 'proof_image_base64'
          ) THEN
              ALTER TABLE payments 
              ADD COLUMN proof_image_base64 TEXT NULL;
          END IF;
      END $$;
    `);
    
    // Step 2: Create index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
      ON payments(status) 
      WHERE proof_image_base64 IS NOT NULL;
    `);
    
    // Step 3: Verify
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'proof_image_base64';
    `);
    
    if (result.rows && result.rows.length > 0) {
      res.json({
        success: true,
        message: '✅ Migration complete! Column proof_image_base64 exists.',
        column: result.rows[0],
        note: 'You can now delete this endpoint: src/routes/run-migration.ts'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Migration executed but column not found'
      });
    }
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

export default router;
