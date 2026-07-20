# AURAGAZE

A mobile-first t-shirt storefront built with Next.js 16, Prisma, PostgreSQL,
and NextAuth. Product requirements and implementation sequencing live in
[`docs/PRD.md`](docs/PRD.md) and [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md).

## What is included

- Storefront: live catalog, category/shop/PDP flows, guest + account cart, COD checkout
- Customer account: auth, orders, wishlist, saved addresses, promo codes
- Admin: dashboard, products, inventory adjustments, order fulfillment
- Seed data: full starter catalog, admin account, and promo code `AURA20`

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). PostgreSQL is exposed on
host port `5433`.

## Default local access

- Storefront: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/login](http://localhost:3000/login)
- Admin area: [http://localhost:3000/admin](http://localhost:3000/admin)
- Seeded admin email: `admin@auragaze.local`
- Seeded admin password: the value of `ADMIN_PASSWORD` in `.env`

If you do not set `ADMIN_PASSWORD`, the seed falls back to
`change-me-before-production` for local development only.

## Environment

Copy `.env.example` and set:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — a random secret (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — application origin
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials created by the seed

Never use the example admin password outside local development.

## Seeded data

- Product catalog with variants and starting inventory
- Admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Promo code `AURA20` for 20% off, capped at `₹2000`

## Database commands

```bash
npx prisma migrate dev       # create/apply a development migration
npx prisma migrate deploy    # apply committed migrations
npx prisma db seed           # idempotently seed products and the admin
npx prisma studio            # inspect local data
```

## Verification checklist

Sprint progress and QA notes live in [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md).
Use the Sprint 9 checklist there for guest browse, cart, checkout, orders, and
admin smoke testing.
