# Bakery ERP — v14.0.0 Clean Foundation

## GitHub structure

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/config.js`
- `js/supabase.js`
- `js/utils.js`
- `supabase/schema.sql`
- `supabase/rls.sql`
- `supabase/seed.sql`
- `manifest.webmanifest`
- `sw.js`

## Supabase

Run `supabase/schema.sql`, then `supabase/rls.sql` in Supabase SQL Editor.

The frontend uses only the public publishable key. Never add a secret/service-role key.

## Business rules already reserved in the architecture

- Sale-enabled items are the source for the Order item list.
- Orders connect to Recipe.
- Recipe drives Production/Packaging issued quantities.
- Purchase quantity is normalized to a base unit.
- Purchase stores a historical cost snapshot.
- Weighted average cost is available for valuation.
- Inventory is ledger-oriented.
- Monthly closing stores Used, Damage, Closing and Sales total values.
- Closing can be locked.
- Item Dashboard is a dedicated destination.

## Important

This release is the clean foundation, not the final feature-complete ERP. The transactional modules will be implemented on top of this schema so that stock and valuation calculations remain consistent.
