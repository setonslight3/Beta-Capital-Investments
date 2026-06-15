# 🚀 Quick Deployment Guide - KYC Cloudinary Migration

## Prerequisites
✅ Cloudinary account (free tier works)  
✅ Access to Neon database console  
✅ Access to Netlify dashboard  

---

## Step 1: Get Cloudinary Credentials (2 minutes)

1. Go to https://cloudinary.com/users/login
2. Click **Settings** → **Access Keys**
3. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## Step 2: Add Environment Variables to Netlify (2 minutes)

1. Go to your Netlify dashboard
2. Navigate to: **Site Settings** → **Environment Variables**
3. Add these three variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

4. Click **Save**

---

## Step 3: Run Database Migration (1 minute)

1. Open your Neon database dashboard: https://console.neon.tech
2. Select your database → **SQL Editor**
3. Paste and run:

```sql
ALTER TABLE kyc_documents RENAME COLUMN file_data_base64 TO file_url;
TRUNCATE kyc_documents;
```

4. Click **Run Query**

> ⚠️ **Note**: `TRUNCATE` clears existing KYC documents. Users will need to re-upload. If you need to preserve existing data, see the full migration guide.

---

## Step 4: Deploy Code (1 minute)

```bash
git add .
git commit -m "Migrate KYC uploads to Cloudinary"
git push origin main
```

Netlify will automatically deploy.

---

## Step 5: Test (2 minutes)

1. Open your site
2. Login and go to **Profile** → **Security** tab
3. Click **Upload KYC Document**
4. Select a test image and submit
5. Verify success message appears
6. Go to admin panel and verify document appears

---

## ✅ Verification

### Check Cloudinary:
- Go to Cloudinary dashboard → **Media Library**
- Look for `kyc-documents` folder
- Verify your test upload appears

### Check Database:
```sql
SELECT id, file_url, file_name FROM kyc_documents LIMIT 5;
```
- URLs should look like: `https://res.cloudinary.com/your-cloud/image/upload/...`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to upload document" | Check Cloudinary env vars are set in Netlify |
| "Column file_data_base64 does not exist" | Migration wasn't run - run Step 3 again |
| "Cloudinary configuration error" | Verify Cloud Name, API Key, Secret are correct |
| Admin can't view documents | Check Cloudinary URLs in database are accessible |

---

## 📞 Need Help?

- Full documentation: `CLOUDINARY_MIGRATION.md`
- Implementation details: `KYC_CLOUDINARY_IMPLEMENTATION.md`
- Cloudinary support: https://support.cloudinary.com

---

**Total Time**: ~8 minutes  
**Complexity**: Easy  
**Risk Level**: Low (only affects KYC uploads)
