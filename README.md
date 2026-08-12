# Bakery ERP v14 — Phase 2 Browser Fix

This build fixes the browser boot problem seen on GitHub Pages.

## Root cause fixed
The previous build loaded Supabase through an ESM import from jsDelivr. If that remote module failed to load, `app.js` never executed, leaving the UI stuck at `Checking…` and making every button appear dead.

This build:
- loads the Supabase UMD browser build first (Unpkg, with jsDelivr fallback)
- uses classic browser scripts for config, utilities, Supabase client, and app
- shows a visible boot error instead of silently staying on `Checking…`
- bumps the service-worker cache version

## Supabase
No SQL changes are required for this browser boot fix.
