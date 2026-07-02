-- Migration: Add proof_image_base64 column to payments table
-- This allows storing payment proof images directly in the database
-- Nullable column - existing payments will have NULL, new payments with proofs will have data

-- Add column if it doesn't exist
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
        
        RAISE NOTICE 'Column proof_image_base64 added to payments table';
    ELSE
        RAISE NOTICE 'Column proof_image_base64 already exists in payments table';
    END IF;
END $$;

-- Add index for faster queries when filtering by status (manual_review payments with proofs)
CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
ON payments(status) 
WHERE proof_image_base64 IS NOT NULL;

-- Add comment
COMMENT ON COLUMN payments.proof_image_base64 IS 'Base64 encoded payment proof image (receipt/screenshot) - nullable for backward compatibility';
