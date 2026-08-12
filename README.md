# Bakery ERP v14 — Phase 2

Phase 2 adds the Sales/Reports layer and separates Production and Packaging into two dedicated pages/tables.

## Main changes
- Production and Packaging are separate pages/tables.
- Issued quantity is auto-calculated from Order + active Recipe.
- Issued remains editable manually before saving.
- Return, Used, Damage and Closing are editable in each operation row.
- Closing is calculated as Opening + In - Issued + Return - Used - Damage.
- Sale table with sale-enabled items only.
- Reports for Purchase Total, Sale Revenue, Used Value, Damage Value and Closing Value.
- More menu opens Item Dashboard / Production / Packaging / Sale / Reports as dedicated pages.
- Myanmar UI support with Myanmar/English toggle and Unicode-friendly font stack.
- Existing Supabase schema is used; no new SQL is required for this UI phase.

## Important
The supplied schema already contains separate operation_type values (`production` and `packaging`) and fields for issued, return, damage, used and closing. It also contains sales/sale_lines and monthly closing fields.
