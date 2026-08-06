# AURAGAZE

A responsive t-shirt storefront built with Next.js 16, Prisma, PostgreSQL,
and NextAuth. Product requirements and implementation sequencing live in
[`docs/PRD.md`](docs/PRD.md) and [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md).

## What is included

- Storefront: live catalog, category/shop/PDP flows, guest + account cart, COD + Razorpay checkout
- Customer account: email/password + Google Sign-In, email verification, password reset, orders, wishlist, addresses, promo codes
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

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — PostgreSQL connection strings
- `NEXTAUTH_SECRET` — a random secret (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — application origin (must match the URL you open in the browser)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials created by the seed
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (optional until you enable Google Sign-In)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` — required for register verification and password reset
- `CLOUDINARY_*` — image uploads in admin
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — online payments (UPI/cards via Razorpay Checkout)

Never use the example admin password outside local development.

## Google OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Configure the OAuth consent screen (External is fine for testing).
3. Create credentials → **OAuth client ID** → Application type **Web application**.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - your production origin (e.g. `https://auragaze.example`)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
6. Paste the Client ID and Client Secret into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
7. Restart `npm run dev`. **Continue with Google** appears on `/login` and `/register`.

Same-email accounts auto-link: an existing password user can later sign in with Google (and vice versa) without creating a duplicate user.

## SMTP setup

Used for email verification after register and for forgot-password links.

1. Create an SMTP mailbox or app password (Gmail/Google Workspace app password, or any SMTP provider).
2. Set in `.env`:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@example.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AURAGAZE <noreply@yourdomain.com>"
```

3. Smoke-test: register a new account → check inbox for the verify link → open it → sign in.

Without SMTP, registration returns an error and does not leave a half-created account.

## Auth behavior notes

- New email/password accounts must verify email before credentials login works.
- Google Sign-In marks the email as verified.
- Sessions last 7 days (JWT). Role is refreshed from the database about every 5 minutes.
- Login / register / forgot-password are rate-limited in-memory (fine for a single Node process; use Redis/Upstash before multi-instance production).

## Seeded data

- Product catalog with variants and starting inventory
- Admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seeded as email-verified)
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

Auth smoke tests after this hardening pass:

1. Seeded admin can sign in with email/password
2. Register → verification email → verify link → credentials login
3. Unverified credentials login is rejected
4. Forgot password → reset email → new password works
5. Google Sign-In creates/links accounts; OAuth-only users cannot use password login
6. Non-admin still cannot open `/admin`
