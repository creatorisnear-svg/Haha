# VIGR Angel Apparel — Workspace

## Overview

Full-stack clothing brand e-commerce store for VIGR Angel Apparel (VAA). pnpm workspace monorepo using TypeScript.

Domain: vaaclothing.xyz

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MongoDB Atlas (MONGODB_URI secret)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Payments**: Stripe (keys stored in MongoDB settings, configured via admin panel at `/dev/dashboard`)

## Architecture

### Frontend (`artifacts/vigr-apparel`)
- React + Vite, Tailwind CSS, Wouter routing
- Cart state via CartContext (`src/context/CartContext.tsx`)
- Auth state via AuthContext (`src/context/AuthContext.tsx`) — localStorage tokens
- Pages: `/` home, `/account/login`, `/account/register`, `/account/orders`, `/dev`, `/dev/dashboard`
- Checkout is a multi-step cart drawer: cart → info+address → Stripe payment → confirmation
- Guest checkout supported (no account required); optional account creation at checkout

### Backend (`artifacts/api-server`)
- Express 5 API server on port 8080 (proxied by Vite in dev)
- Routes registered in `src/routes/index.ts`
  - `/api/products` — public product list
  - `/api/admin/*` — admin CRUD (products, settings, orders) — requires admin JWT
  - `/api/checkout` — guest or authenticated order placement (verifies Stripe PaymentIntent if Stripe configured)
  - `/api/payments/intent` — creates Stripe PaymentIntent for checkout
  - `/api/config` — returns Stripe publishable key for frontend
  - `/api/customers/*` — customer register/login/orders
  - `/api/newsletter` — email subscribe
- Admin auth: HMAC token (`vaa_admin_token` in localStorage); password: `omar1267`
- Customer auth: HMAC token (`vaa_customer_token` in localStorage)

### Database — MongoDB (`artifacts/api-server/src/lib/mongodb.ts`)
Collections:
- `products` — product catalog (each has optional `category` string label)
- `categories` — admin-managed category list (`name`, `slug`)
- `customers` — registered customer accounts
- `orders` — all orders (guest or customer)
- `settings` — key/value (stripe_publishable_key, stripe_secret_key, admin_password_hash)
- `newsletter` — email subscribers

### Categories & Navigation
- Admin manages categories in the **Categories** tab of `/dev/dashboard` (CRUD).
- Product form's category field is a dropdown of admin-created categories.
- Storefront has a top-left hamburger menu (Sheet drawer) that lists Shop All, every category (clicking filters the product grid), About, Track Order, Account, and Admin.
- Endpoints: `GET /api/categories` (public), `GET/POST/PUT/DELETE /api/admin/categories` (admin JWT).

## Stripe Configuration (IMPORTANT)

**NOT using Replit Stripe integration** (user dismissed it — will add keys via admin panel once hosted on Cloudflare). Instead:
1. Go to `/dev` on the live site, log in with admin password `omar1267`
2. In the **Settings** tab of the dashboard, enter Stripe Publishable Key and Secret Key
3. These are stored in the MongoDB `settings` collection and read at runtime
4. When Stripe is NOT configured, checkout still works (orders saved without payment — dev/testing mode)
5. When Stripe IS configured, checkout requires a confirmed PaymentIntent before saving the order

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — run API server (builds then starts)
- `pnpm --filter @workspace/vigr-apparel run dev` — run frontend

## Admin Access

- URL: `/dev`
- Password: `omar1267`
- Change password in the Settings tab of `/dev/dashboard`
