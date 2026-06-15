-- Migration: Convert KYC documents from base64 storage to Cloudinary URLs
-- This migration renames the column and updates the structure
-- Note: Existing data will need to be migrated manually or will be lost

-- Step 1: Rename the column from file_data_base64 to file_url
ALTER TABLE kyc_documents 
RENAME COLUMN file_data_base64 TO file_url;

-- Step 2: For any existing records, you can either:
-- A) Clear them and require re-upload (recommended for clean migration):
-- TRUNCATE kyc_documents;

-- B) Or set a placeholder URL and handle migration separately:
-- UPDATE kyc_documents SET file_url = 'MIGRATION_REQUIRED' WHERE file_url IS NOT NULL;

-- Note: After this migration, the application will store Cloudinary URLs instead of base64 data
