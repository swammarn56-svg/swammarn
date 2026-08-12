# Bakery ERP v14 — Item Dashboard Module

This ZIP replaces the previous foundation files with a working Item Dashboard connected to Supabase.

## Before opening the app

1. `schema.sql` and `rls.sql` should already have been run in Supabase.
2. Create a user in Supabase Authentication → Users.
3. Sign in from the app using that account.
4. Add an item and verify it appears in the `items` table.

## Item rules

- Base unit is `g` or `pcs`.
- Purchase unit can be `g`, `kg`, `pcs`, `box`, or `pack`.
- `unit_factor_to_base` stores the conversion to the item's base unit.
- Sale/Production/Packaging flags are stored on the item.
- Deactivation keeps historical rows while removing the item from active workflows.
- The next Order module should query only `sale_enabled = true` items.

## Security

Only the Supabase publishable key is shipped to the browser. Do not add a service-role/secret key.
The current RLS policies require authenticated users. Role-specific policies should be tightened before production.
