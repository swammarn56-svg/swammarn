# Bakery ERP v14 — Phase 1 Core Operations

This build extends the working Item Dashboard into the Phase 1 core flow:
Items → Purchase → Inventory Ledger → Recipes → Orders → Production/Packaging Operations.

## Supabase
The existing `schema.sql` and `rls.sql` remain compatible. Do not rerun them if already applied.

## Purchase
Example: 40 kg at 500,000 MMK becomes 40,000 g and 12.50 MMK/g when the item's base unit is g.

A purchase is a draft until **Confirm**. Confirming it marks the purchase confirmed/applied and writes one inventory-ledger receipt.

## Recipe / Order
Recipes define component base quantities per one base unit of output. Orders only offer active items with `sale_enabled=true`. Issuing an order reads the active recipe, calculates component issued quantities, records daily operations, and writes negative inventory-ledger movements using the current weighted average cost.

## Important
The browser uses only the Supabase publishable key. Never add a service-role/secret key.
Phase 2 will add Sales, reporting, monthly closing, permissions, audit hardening and final UX polish.
