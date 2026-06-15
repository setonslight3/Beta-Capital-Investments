# KYC Cloudinary Migration Guide

## Overview
This migration moves KYC document storage from base64-encoded data in the PostgreSQL database to Cloudinary cloud storage.

## Benefits
- Reduced database size and improved performance
- Faster document uploads and retrievals
- Better scalability for document management
- CDN-backed delivery of documents

## Prerequisites
1. Cloudinary account (sign up at https://cloudinary.com if you don't have one)
2. Cloudinary credentials: Cloud Name, API Key, API Secret

## Environment Variables
Add the following environment variables to your Netlify deployment:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

You can find these values in your Cloudinary dashboard under "Account Details" → "API Keys".

## Database Migration

### Option 1: Clean Migration (Recommended for New/Testing Deployments)
This clears all existing KYC documents and requires users to re-upload:

```sql
-- Run this in your Neon database console
ALTER TABLE kyc_documents RENAME COLUMN file_data_base64 TO file_url;
TRUNCATE kyc_documents;
```

### Option 2: Preserve Existing Records (Requires Manual Data Migration)
If you have existing KYC documents that need to be preserved:

```sql
-- Step 1: Rename the column
ALTER TABLE kyc_documents RENAME COLUMN file_data_base64 TO file_url;

-- Step 2: Mark existing records for migration
UPDATE kyc_documents SET file_url = 'MIGRATION_PENDING';
```

Then you'll need to create a migration script to:
1. Fetch all records with `file_url = 'MIGRATION_PENDING'`
2. For each record, upload the base64 data to Cloudinary
3. Update the record with the new Cloudinary URL

## Deployment Steps

1. **Set environment variables** in Netlify
2. **Run database migration** (choose Option 1 or Option 2 above)
3. **Deploy the updated code** to Netlify
4. **Test the upload flow** by submitting a new KYC document

## Testing

After deployment, verify:
1. New KYC submissions upload successfully
2. Admin can view uploaded documents in the admin panel
3. Document URLs are in Cloudinary format: `https://res.cloudinary.com/...`

## Rollback

If you need to rollback:

```sql
-- Rename column back
ALTER TABLE kyc_documents RENAME COLUMN file_url TO file_data_base64;

-- Clear Cloudinary-based records
TRUNCATE kyc_documents;
```

Then redeploy the previous version of the code.

## Changes Made

### Code Changes
1. **Added Cloudinary package** to `artifacts/api-server/package.json`
2. **Created Cloudinary utility** at `artifacts/api-server/src/lib/cloudinary.ts`
3. **Updated database schema** in `lib/db/src/schema/index.ts` - changed `fileDataBase64` to `fileUrl`
4. **Updated KYC routes** in `artifacts/api-server/src/routes/kyc.ts` - now uploads to Cloudinary
5. **Updated admin routes** in `artifacts/api-server/src/routes/admin.ts` - now redirects to Cloudinary URL

### Frontend Changes
**None required** - The frontend continues to send base64 data. The backend handles the Cloudinary upload transparently.

## Cloudinary Folder Structure
Documents are organized in Cloudinary as:
```
kyc-documents/
  ├── {timestamp}_{filename}
  ├── {timestamp}_{filename}
  └── ...
```

## Security Notes
- Cloudinary URLs are publicly accessible but unpredictable (long random strings)
- Admin authentication is still required to access the `/admin/kyc/:id/file` endpoint
- Consider enabling Cloudinary's authentication features for additional security if needed

## Support
For issues, check:
1. Cloudinary dashboard logs for upload errors
2. Netlify function logs for backend errors
3. Browser console for frontend errors
