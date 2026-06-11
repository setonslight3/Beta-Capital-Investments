---
name: BetterCapitalInvestment project
description: Key decisions and gotchas for the BetterCapitalInvestment investment platform in Serverless-Finance/.
---

## Location
All code lives in `/home/runner/workspace/Serverless-Finance/`. Do NOT edit workspace root artifacts.

## Tier Names (canonical, matches data.ts)
Bronze Ore → Silver Ore → Gold Ore → Platinum Ore → Diamond Ore
- Default signup tier is "Bronze Ore" (lowest)
- Thresholds: Bronze <$10k, Silver $10k, Gold $50k, Platinum $250k, Diamond $1M
- ROI is DAILY (not weekly) over 30-day term. Admin labels say "Daily %".
- Default rates: Bronze 0.25%/day, Silver 0.35%, Gold 0.45%, Platinum 0.55%, Diamond 0.70%

## PlatformContext
`src/context/PlatformContext.tsx` — fetches `/api/settings` once on mount, provides `usePlatform()` hook.
App.tsx wraps everything in `<PlatformProvider>` at the root.
LandingView.tsx uses `usePlatform()` — do NOT add local fetch for platform settings there.
`platform.platformName` → rendered in footer/header/copyright.

## Public Settings Endpoint
GET `/api/settings` (no auth required) — returns SAFE_KEYS subset.
SAFE_KEYS now includes: tier_roi_*, tier_min_*, tier_desc_* plus gateway toggles, social links, platform_name, maintenance_mode, allow_new_signups, support_email.

## ROI is DAILY
Investment ROI is applied daily over 30 days. Early exit before 30 days incurs penalty (configurable in admin).
Admin label: "Tier Daily ROI Rates (%)" — e.g. 0.25 means 0.25% per day.
NOTIFY_ON_CHANGE broadcasts "X% per day" message on change.

## Coinbase Chart Granularity
`granularity = days <= 7 ? 3600 : 86400` — Coinbase max 300 candles; 30d×1h=720 (breaks). Fixed.

## Biometric WebAuthn
RP_ID = process.env.APP_DOMAIN ?? "localhost". Must match actual domain exactly.
userVerification: "discouraged", authenticatorAttachment: "platform" for fingerprint preference.

## Rate Limiting
200 req/15min global, 20 req/15min on /auth routes. helmet() for security headers.

## Admin Settings Broadcast
When tier_roi_* or early_exit_penalty changes via PATCH /admin/settings,
all users automatically receive an in-app notification (defined in NOTIFY_ON_CHANGE map).

## PWA Setup
manifest.json in `public/`, sw.js in `public/`, registered in main.tsx.
`beforeinstallprompt` captured globally → `window.__pwaPrompt`, dispatches `__pwaPromptReady` event.
PWAInstallPrompt.tsx component shown globally from App.tsx (variant="banner").
PWA install prompt only triggers on HTTPS (Netlify), not on Replit dev server.

## CookieConsent
Has Reject All, Manage (per-category toggles), and Accept All options.
Categories: Essential (required), Preferences, Analytics.
State stored in localStorage: BetterCapitalInvestment_cookie_consent + BetterCapitalInvestment_cookie_prefs.

## Tawk.to
Property ID: 6a2abea9135ef41c3064d7ee, Widget ID: 1jqrfhhj9
URL: https://embed.tawk.to/{propertyId}/{widgetId}
Brand color (#F2CA50) must be set in Tawk.to dashboard → Appearance, cannot be set via JS API.
JS API sets z-index and injects CSS for button color override on load.

## Cloudflare + Netlify
Netlify manages DNS via nameservers — Cloudflare full proxy conflicts.
Option A: Cloudflare Turnstile CAPTCHA (no DNS change, works on Netlify).
Option B: Move nameservers to Cloudflare → A record to 75.2.60.5 → enable WAF/Bot Fight Mode.

## Random Reloading in Replit
Dev-only: Vite HMR reloads on file saves, Replit WebSocket reconnects on container idle.
Not an issue in production on Netlify (static SPA from CDN).
