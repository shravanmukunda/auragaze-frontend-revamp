# AURAGAZE — Sprint Plan

**Based on:** `[docs/PRD.md](./PRD.md)`  
**Cadence:** ~1 sprint ≈ 1 focused implementation pass (roughly 2–4 days of work each)  
**Order:** Dependencies first — schema/auth before checkout; catalog before admin polish  

Use this file to prompt the coding agent **one sprint at a time**.

---

## Sprint overview


| Sprint | Name                     | Theme                            | Depends on |
| ------ | ------------------------ | -------------------------------- | ---------- |
| 0      | Foundations              | Schema, seed, env, middleware    | —          |
| 1      | Auth                     | Login/register/session/profile   | 0          |
| 2      | Catalog API              | Replace mock catalog with DB     | 0          |
| 3      | Cart sync                | Guest + authenticated cart       | 1, 2       |
| 4      | Checkout & orders        | Place order, stock, My Orders    | 3          |
| 5      | Admin shell + products   | Admin auth, CRUD products        | 1, 2       |
| 6      | Inventory                | Stock ledger + adjustments       | 5          |
| 7      | Admin orders + dashboard | Fulfillment + overview metrics   | 4, 5       |
| 8      | Customer extras          | Search, wishlist, addresses      | 4          |
| 9      | Polish & launch          | Empty states, seed QA, hardening | All        |


---

## Sprint 0 — Foundations

**Goal:** Database and product model ready for a real tee catalog.

### Tasks

- [x] Extend Prisma schema per PRD §6 (`slug`, `brand`, `badge`, `features`, Address, Order shipping fields, etc.)
- [x] Create and run migration
- [x] Implement seed script: import/transform products from `src/lib/data.ts` (or generator) into `Product` + `ProductImage` + `ProductVariant` with realistic stock
- [x] Create default admin user (e.g. `admin@auragaze.local` / env-based password)
- [x] Document `.env` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- [x] Confirm Docker Postgres (`docker-compose`) boots and Prisma connects
- [x] Resolve middleware: wire admin protection correctly for Next 16 (`proxy.ts` / middleware convention per `AGENTS.md`)

### Acceptance criteria

- `npx prisma db seed` populates ≥15 products with variants
- `GET /api/products` returns seeded data with images + variants
- Admin user exists with `role: ADMIN`

### Prompt

> Implement Sprint 0 from `docs/SPRINT_PLAN.md`. Follow schema changes in `docs/PRD.md` §6. Seed from existing mock catalog. Do not change storefront UI yet.

---

## Sprint 1 — Authentication

**Goal:** Real accounts; profile stops being fake.

### Tasks

- [x] Add `SessionProvider` to `Providers.tsx`
- [x] Build `/login` and `/register` pages (match storefront visual language)
- [x] Harden `POST /api/register` (validation, duplicate email)
- [x] Wire profile page to `useSession` (name, email; hide Premium fake badge or gate later)
- [x] Working Sign Out (`signOut`)
- [x] Redirect unauthenticated users from checkout/profile-sensitive routes as needed
- [x] Ensure JWT session exposes `role` (already typed)

### Acceptance criteria

- Guest can register → auto login or redirect to login
- Logged-in profile shows real user; Sign Out clears session
- `/admin` redirects unauthenticated users to `/login`

### Prompt

> Implement Sprint 1 from `docs/SPRINT_PLAN.md`. Wire NextAuth into the UI. Replace hardcoded profile user. Keep mobile storefront styling.

---

## Sprint 2 — Catalog wired to DB

**Goal:** Storefront reads products from API/DB, not mock arrays.

### Tasks

- [x] Expand product APIs: list (filters/sort/category), get by id/slug
- [x] Add mapper: Prisma → frontend `Product` type
- [x] Update home, shop, product detail, categories pages to fetch real data
- [x] Keep `FREE_SHIPPING_THRESHOLD` / `SHIPPING_FEE` constants; retire product mocks from page imports
- [x] Handle empty categories gracefully
- [x] Loading and empty states on shop/product

### Acceptance criteria

- No catalog page imports product arrays from `data.ts`
- Shop filters/sort still work against API data
- Product detail shows live variant stock (disable OOS sizes/colors)

### Prompt

> Implement Sprint 2 from `docs/SPRINT_PLAN.md`. Replace mock catalog usage with API/DB. Preserve existing UI components and layout.

---

## Sprint 3 — Cart synchronization

**Goal:** Cart works for guests and logged-in users against variants.

### Tasks

- [x] Refactor `CartContext` to key items by `variantId` (size+color), not only product id
- [x] Fix/replace `POST /api/cart/add`; add GET, PATCH quantity, DELETE item, clear
- [x] Guest: keep localStorage; on login: merge into DB cart
- [x] Enforce stock caps from live variant stock
- [x] Cart page uses enriched line items (name, image, price from API)

### Acceptance criteria

- Add to cart from PDP with selected size/color persists correctly
- Login merges guest cart without duplicates exploding quantity past stock
- Cart badge count stays accurate

### Prompt

> Implement Sprint 3 from `docs/SPRINT_PLAN.md`. Make cart variant-aware and sync for authenticated users. Fix the buggy cart API.

---

## Sprint 4 — Checkout & customer orders

**Goal:** End-to-end purchase with inventory side effects.

### Tasks

- [x] Add `/checkout` page: address form, shipping summary, COD place-order
- [x] Add Address model APIs (CRUD) or inline address on checkout for MVP
- [x] `POST /api/checkout`: create Order + OrderItems, decrement stock, write `InventoryTransaction` OUT, clear cart
- [x] Order confirmation page
- [x] My Orders list + order detail (status timeline)
- [x] Wire cart Checkout button
- [x] Transactional safety (Prisma `$transaction`) for stock race conditions

### Acceptance criteria

- Customer can place COD order; stock decreases; inventory OUT logged
- Order visible under Profile → My Orders with correct line items
- Oversell prevented when stock insufficient

### Prompt

> Implement Sprint 4 from `docs/SPRINT_PLAN.md`. Full checkout with COD, stock decrement, and My Orders. Use Prisma transactions.

---

## Sprint 5 — Admin shell + product management

**Goal:** Admins can manage the tee catalog.

### Tasks

- [x] Create `/admin` layout (sidebar, desktop-first)
- [x] Enforce ADMIN role on all `/admin` pages and `/api/admin/*`
- [x] Products list (search, category filter)
- [x] Create / edit product (name, brand, category, prices, badge, features, images URLs)
- [x] Manage variants (size, color, SKU, stock) on product edit
- [x] Soft-delete or `isActive` toggle
- [x] Expand admin product API beyond single POST (GET/PATCH/DELETE)

### Acceptance criteria

- Non-admin cannot access admin UI/API
- Admin can create a new tee with 2 colors × 4 sizes and see it on the storefront
- Admin can deactivate a product and it disappears from shop

### Prompt

> Implement Sprint 5 from `docs/SPRINT_PLAN.md`. Build admin layout and product CRUD with variants. Match PRD admin IA.

---

## Sprint 6 — Inventory management

**Goal:** Stock is operable as a first-class admin feature.

### Tasks

- [x] `/admin/inventory` table: product, variant, SKU, stock, low-stock flag
- [x] Adjust stock modal: type IN / OUT / ADJUSTMENT + quantity + note
- [x] API writes `InventoryTransaction` and updates `ProductVariant.stock`
- [x] Low-stock filter (e.g. stock ≤ 5)
- [x] Optional: inventory history drawer per variant

### Acceptance criteria

- Adjusting +10 stock updates variant and creates IN (or ADJUSTMENT) row
- Low-stock list accurate
- Checkout OUT transactions appear in history

### Prompt

> Implement Sprint 6 from `docs/SPRINT_PLAN.md`. Full inventory management UI + ledger per PRD AD-06/AD-07.

---

## Sprint 7 — Admin orders + dashboard overview

**Goal:** Fulfillment and at-a-glance ops.

### Tasks

- [x] `/admin/orders` list with status filters
- [x] Order detail: customer, address snapshot, items, status actions
- [x] Status transitions with rules (e.g. cancel before shipped restores stock)
- [x] `/admin` overview: revenue (COD placed), open orders, low-stock count, recent orders
- [x] `GET /api/admin/stats`

### Acceptance criteria

- Admin can move PENDING → CONFIRMED → SHIPPED → DELIVERED
- Cancel restores stock once
- Dashboard numbers match DB

### Prompt

> Implement Sprint 7 from `docs/SPRINT_PLAN.md`. Admin order fulfillment and dashboard stats.

---

## Sprint 8 — Customer extras

**Goal:** Close high-value storefront gaps already hinted in the UI.

### Tasks

- [x] `/search` page (query products by name/brand/category)
- [x] Wishlist (persist for logged-in users; wire heart on PDP/cards)
- [x] Address book under profile
- [x] `/about` simple brand page (optional if time)
- [x] Promo code stub (optional P2 — skip if behind)

### Acceptance criteria

- Search from TopBar works
- Wishlist survives refresh for logged-in users
- Checkout can pick a saved address

### Prompt

> Implement Sprint 8 from `docs/SPRINT_PLAN.md`. Search, wishlist, and address book. Skip promo codes if time-boxed.

---

## Sprint 9 — Polish & launch readiness

**Goal:** Make the app shippable for a demo / soft launch.

### Tasks

- [x] Empty/error/loading states audit across storefront + admin
- [x] Toast feedback on cart, checkout, admin actions (sonner)
- [x] Hide empty categories or seed them
- [x] Remove or clearly isolate leftover mock-only paths
- [x] Basic README: setup, seed, admin login, sprint docs link
- [x] Manual QA checklist pass (below)
- [x] Performance pass: images, avoid over-fetching on home

### Acceptance criteria

- Fresh clone: docker up → migrate → seed → `npm run dev` works
- QA checklist all green
- No critical console errors on main flows

### Prompt

> Implement Sprint 9 from `docs/SPRINT_PLAN.md`. Polish, docs, and QA for soft launch. No new major features.

---

## Manual QA checklist (Sprint 9)

**Run:** 2026-07-20 on `http://localhost:3001` (seeded DB)

- [x] Browse home → shop → PDP as guest
- [x] Add variant to cart; badge updates
- [x] Register; cart merges
- [ ] Checkout COD; confirmation shown — order succeeds (stock ↓, cart clears, My Orders) but redirects to `/cart` instead of `/orders/confirmation/[id]` (race with empty-cart redirect)
- [x] Stock decreased on PDP — Antagonist M: 7 → 6 after order
- [x] My Orders shows order — PENDING ₹4,700, 1 item
- [x] Admin login; create product; appears in shop — `QA Sprint9 Test Tee` visible in admin + search + PDP
- [x] Admin adjust inventory; stock updates — Black/L IN +5: 10 → 15
- [x] Admin ship order; customer sees new status — admin timeline SHIPPED (Confirm → Mark shipped); customer detail not re-verified after admin session swap
- [x] Customer cannot open `/admin` — redirected to `/?error=AccessDenied`
- [x] Free shipping bar correct around ₹4000 — ₹4,700 subtotal → Free; ₹3,500 subtotal → ₹99 + “Add ₹500 more for free shipping”

### QA notes (non-blocking)

- React hydration warnings on auth/splash and checkout (`PromoCodeForm` nested `<form>` inside checkout `<form>`)
- Bottom nav can intercept taps on sticky CTAs (Place order, Sign out) — scroll into view before click

---

## Suggested prompt template (copy/paste)

```text
Follow docs/PRD.md and docs/SPRINT_PLAN.md.

Implement Sprint <N> — <Name>.

Constraints:
- Preserve existing storefront UI/UX unless the sprint requires new pages
- Prefer wiring real data over redesign
- Admin is desktop-first; storefront stays mobile-first
- Do not implement later sprints

Deliver:
- Code for all sprint tasks
- Meet acceptance criteria
- Short summary of what changed and how to verify
```

---

## Progress tracker


| Sprint              | Status      | Notes                                                                            |
| ------------------- | ----------- | -------------------------------------------------------------------------------- |
| 0 Foundations       | Complete    | 20 products, 343 variants, admin account and API verified                        |
| 1 Auth              | Complete    | Register, sign in, JWT session, protected profile, and sign out verified         |
| 2 Catalog API       | Complete    | 20 DB products mapped with live variants, filtering, sorting, and catalog states |
| 3 Cart sync         | Complete    | Variant-aware cart, DB sync for auth users, guest merge on login                 |
| 4 Checkout & orders | Complete    | COD checkout, stock decrement, inventory OUT, My Orders                          |
| 5 Admin products    | Complete    | Admin shell, product CRUD with variants, isActive toggle, API guards             |
| 6 Inventory         | Complete    | Variant stock table, adjust modal, ledger history, low-stock ≤5                  |
| 7 Admin orders      | Complete    | Fulfillment flow, cancel stock restore, dashboard stats API                      |
| 8 Customer extras   | Complete    | Search, wishlist, address book, checkout address picker, about page, promo codes |
| 9 Polish            | Complete    | QA pass done; fix checkout confirmation redirect + nested promo form before launch |


