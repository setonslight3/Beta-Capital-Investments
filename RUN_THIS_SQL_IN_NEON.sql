-- ============================================================================
-- COPY THIS ENTIRE FILE AND RUN IT IN NEON CONSOLE SQL EDITOR
-- ============================================================================
-- 
-- Instructions:
-- 1. Go to: https://console.neon.tech/
-- 2. Select your project (ep-broad-rice-aq7a4t5w)
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Copy and paste ALL of this SQL
-- 5. Click "Run" button
-- 6. Look for success message
--
-- ============================================================================

-- Step 1: Add proof_image_base64 column (if it doesn't exist)
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

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
ON payments(status) 
WHERE proof_image_base64 IS NOT NULL;

-- Step 3: Add documentation
COMMENT ON COLUMN payments.proof_image_base64 IS 'Base64 encoded payment proof image (receipt/screenshot) - nullable for backward compatibility';

-- Step 4: Verify the column was created successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    'SUCCESS! Column exists and is ready to use.' as status
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'proof_image_base64';

-- ============================================================================
-- If you see one row returned above, the migration is COMPLETE! ✅
-- ============================================================================
