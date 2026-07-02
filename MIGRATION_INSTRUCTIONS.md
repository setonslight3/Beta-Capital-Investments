# Database Migration Instructions

## ✅ What Needs To Be Done

You need to add the `proof_image_base64` column to your `payments` table in the Neon database.

## 🚀 Quick Method: Use Neon Console (Recommended)

1. **Go to Neon Console**: https://console.neon.tech/
2. **Select your project**: "Beta Capital Investments" or the project containing your database
3. **Click "SQL Editor"** in the left sidebar
4. **Paste this SQL** into the editor:

```sql
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

CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
ON payments(status) 
WHERE proof_image_base64 IS NOT NULL;

COMMENT ON COLUMN payments.proof_image_base64 IS 'Base64 encoded payment proof image (receipt/screenshot) - nullable for backward compatibility';
```

5. **Click "Run"** button
6. **Look for success message** - should say "Column proof_image_base64 already exists" or "added to payments table"

## ✅ Verify Migration Worked

Run this verification query in the same SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'proof_image_base64';
```

You should see:
- **column_name**: `proof_image_base64`
- **data_type**: `text`
- **is_nullable**: `YES`

## 🎉 After Migration

Once the migration is complete:

1. ✅ Payment proof uploads (crypto + bank transfer) will work
2. ✅ Admin dashboard "View Proof" buttons will work
3. ✅ All existing payments remain unchanged (column is nullable)
4. ✅ Ready to deploy to production!

## 📝 What This Migration Does

- **Adds column**: `proof_image_base64 TEXT NULL` to `payments` table
- **Creates index**: Speeds up queries for payments with proofs
- **Safe**: Idempotent (can run multiple times safely)
- **Backward compatible**: Existing payments will have NULL, won't break anything

## ❓ Troubleshooting

**If you get "column already exists"**: ✅ Perfect! Migration already ran, you're all set.

**If you get a permission error**: Make sure you're logged in with the database owner account.

**If Neon Console isn't available**: You can also use any PostgreSQL client (pgAdmin, DBeaver, etc.) with your connection string:
```
postgresql://neondb_owner:npg_N2nO4BhoYAvV@ep-broad-rice-a7a4t5w.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Your Connection Details

- **Host**: `ep-broad-rice-a7a4t5w.us-east-1.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **Region**: `us-east-1` (AWS)
