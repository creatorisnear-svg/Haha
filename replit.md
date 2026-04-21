# VIGR Angel Apparel — Workspace

## Overview

Full-stack clothing brand website for VIGR Angel Apparel (VAA). pnpm workspace monorepo using TypeScript.

Domain: vaaclothing.xyz

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Payments**: Stripe (keys stored in DB, configured via admin panel)

## Architecture

### Frontend (`artifacts/vigr-apparel`)
- React + Vite, Tailwind CSS
- Wouter for routing
- Cart state via React Context
- Pages: `/` (home), `/dev` (admin login), `/dev/dashboard` (admin panel), `/checkout/success`, `/checkout/cancel`

### Backend (`artifacts/api-server`)
- Express 5 API server
- Routes: `/api/products`, `/api/admin/*`, `/api/checkout`, `/api/newsletter`, `/api/settings/stripe-public-key`
- Admin auth: HMAC token (stored in localStorage as `vaa_admin_token`)
- Default admin password: `vigr-admin` (change via Stripe Config tab in dashboard)

### Database (`lib/db`)
- `products` table — product catalog
- `settings` table — key/value for Stripe keys (`stripe_publishable_key`, `stripe_secret_key`), admin password hash
- `newsletter` table — email subscribers

## Stripe Configuration

**NOT using Replit Stripe integration** (user dismissed it). Instead:
- Developer goes to `/dev` on the website, logs in with the admin password
- In the **Stripe Config** tab of the dashboard, they enter their Stripe Publishable Key and Secret Key
- These are stored in the `settings` database table
- The checkout route reads them from the DB at runtime

To use Stripe in the future via Replit's integration, the user would need to authorize the Stripe connector in the Integrations tab.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Admin Access

- URL: `/dev`
- Default password: `vigr-admin`
- Change password in the Stripe Config tab of `/dev/dashboard`
