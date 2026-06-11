---
name: AlphaVest project
description: Key decisions and gotchas for the AlphaVest investment platform in Serverless-Finance/.
---

## Location
All code lives in `/home/runner/workspace/Serverless-Finance/`. Do NOT edit workspace root artifacts.

## Tier Names (canonical, matches data.ts)
Bronze Ore → Silver Ore → Gold Ore → Platinum Ore → Diamond Ore
- auth.ts `tierFromWealth()` must use these exact names
- Default signup tier is "Bronze Ore" (lowest)
- Thresholds: Bronze <$5k, Silver $5k, Gold $25k, Platinum $100k, Diamond $500k

## Public Settings Endpoint
GET `/api/settings` (no auth required) — returns safe keys for frontend:
gateway toggles, withdraw toggles, support_email, social links, platform_name, maintenance_mode, allow_new_signups.
Added to admin.ts, mounted via routes/index.ts → app.ts at /api.

## Coinbase Chart Granularity
`granularity = days <= 7 ? 3600 : 86400` — Coinbase max 300 candles; 30d×1h=720 (breaks). Fixed.

## Biometric WebAuthn
RP_ID = process.env.APP_DOMAIN ?? "localhost". Must match actual domain exactly.
userVerification: "discouraged", authenticatorAttachment: "platform" for fingerprint preference.

## Rate Limiting
200 req/15min global, 20 req/15min on /auth routes. helmet() for security headers.
Both added via express-rate-limit and helmet in app.ts.

## Admin Settings Broadcast
When tier_roi_* or early_exit_penalty changes via PATCH /admin/settings,
all users automatically receive an in-app notification (defined in NOTIFY_ON_CHANGE map).

## Tawk.to
Property ID: 6a2abea9135ef41c3064d7ee, Widget ID: 1jqrfhhj9
URL: https://embed.tawk.to/{propertyId}/{widgetId}
