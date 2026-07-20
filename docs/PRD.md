# AURAGAZE — Product Requirements Document

**Product:** AURAGAZE — mobile-first platform to sell oversized / graphic t-shirts  
**App root:** `agz/` (Next.js 16 App Router)  
**Status:** Storefront UI is largely complete on mock data; backend is scaffolded but mostly disconnected  
**Last updated:** 2026-07-19

---

## 1. Vision

AURAGAZE is a DTC apparel store focused on t-shirts (oversized, graphic, basics, full sleeve) with a polished mobile shopping experience and a full admin back-office for catalog, inventory, and order operations.

**North star:** A customer can browse real products, add variant-specific items to cart, check out, and track orders. An admin can manage products, stock by size/color, and fulfill orders end-to-end.

---

## 2. Current state (audit summary)

### What exists and works (UI)

| Area | Status |
|------|--------|
| Home (hero, categories, featured, new arrivals) | UI complete — mock data |
| Shop (filter chips, sort sheet, grid) | UI complete — mock data |
| Product detail (gallery, color/size/qty, similar) | UI complete — mock data |
| Categories list + category products | UI complete — mock data |
| Cart (qty, summary, free-shipping bar) | Client-only (`localStorage`) |
| Profile shell + menu stubs | Hardcoded user; links go to `#` |
| Legal pages (privacy, terms, refund) | Static |
| Theme (light/dark), splash, floating nav | Working |

### What exists but is disconnected (backend)

| Area | Status |
|------|--------|
| Prisma + Postgres schema | Models present; seed empty |
| `GET /api/products` | Works; **UI never calls it** |
| `POST /api/admin/products` | Creates product+variants; **no auth guard** |
| `POST /api/cart/add` | Partial / buggy; unused by UI |
| `POST /api/register` | Creates user; no UI |
| NextAuth (credentials + Prisma adapter) | Configured; **no SessionProvider / login UI** |
| `proxy.ts` admin guard | Intended for `/admin/*`; not active as middleware; `/login` missing |

### Critical gaps

- No checkout / order creation / payments
- No admin dashboard UI
- No inventory management UI or stock-decrement on order
- Schema ↔ frontend `Product` type mismatch (brand, badge, rating, features, etc.)
- Dead links: `/search`, `/about`, `/login`
- Profile features (orders, wishlist, addresses, payments) are stubs

---

## 3. Goals & non-goals

### Goals (MVP → launch)

1. Replace mock catalog with DB-backed products + variants (size × color × stock).
2. Real auth (register, login, logout, session-aware profile).
3. Cart synced for logged-in users; guest cart via localStorage with merge on login.
4. Checkout → create Order + OrderItems; decrement stock; log inventory transactions.
5. Customer: order history + basic tracking statuses.
6. Admin dashboard: products CRUD, inventory, orders, basic analytics.
7. Seed realistic t-shirt catalog from existing mock/generator data.

### Non-goals (post-MVP / later)

- Full payment gateway (Razorpay/Stripe) — MVP can use “COD / Pay later” or mock payment confirmation
- Reviews & ratings system (keep display fields; defer write path)
- Loyalty / Premium Member tiers
- Push notifications, saved payment methods vault
- Multi-warehouse / multi-currency
- Custom t-shirt designer / print-on-demand
- Native mobile apps

---

## 4. Users & roles

| Role | Who | Capabilities |
|------|-----|--------------|
| **Guest** | Anonymous shopper | Browse, search, cart (local), cannot checkout until login/register (or soft-gate at checkout) |
| **Customer** | Registered shopper | Full shop, checkout, orders, wishlist, addresses, profile |
| **Admin** | Store operator | Admin dashboard: catalog, inventory, orders, users (read) |

---

## 5. Feature inventory

### 5.1 Storefront (customer)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| SF-01 | Home feed from DB (featured, new arrivals, categories) | P0 | Keep existing UI; swap data source |
| SF-02 | Shop listing with filters & sort | P0 | Wire to API; preserve chips/sort sheet |
| SF-03 | Product detail by ID/slug | P0 | Variant-aware stock; images from `ProductImage` |
| SF-04 | Category pages | P0 | |
| SF-05 | Search page (`/search`) | P1 | Currently linked, missing |
| SF-06 | About page (`/about`) | P2 | Currently linked, missing |
| SF-07 | Guest cart (localStorage) | P0 | Already exists |
| SF-08 | Authenticated cart (DB sync) | P0 | Merge guest → user cart on login |
| SF-09 | Checkout flow | P0 | Address, shipping, place order |
| SF-10 | Order confirmation | P0 | |
| SF-11 | My Orders + order detail / status | P0 | Profile menu today |
| SF-12 | Wishlist | P1 | Heart UI exists locally |
| SF-13 | Address book | P1 | Needed for repeat checkout |
| SF-14 | Promo codes | P2 | `AURA20` hinted in UI |
| SF-15 | Free shipping threshold | P0 | Already in cart UI (`₹4000` / fee `₹99`) |
| SF-16 | Auth: register / login / logout | P0 | |
| SF-17 | Profile (real user data) | P0 | Replace “Alex Jordan” mock |
| SF-18 | Help & Support | P2 | Static FAQ ok for MVP |

### 5.2 Admin dashboard

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| AD-01 | Admin auth gate (`ADMIN` role) | P0 | Fix middleware; `/login` |
| AD-02 | Dashboard overview | P0 | Orders today, low stock, revenue summary |
| AD-03 | Products list + create/edit/delete | P0 | Extend beyond single POST |
| AD-04 | Variant management (size, color, SKU, price override optional) | P0 | Core for tees |
| AD-05 | Image upload / URL management | P0 | Start with URL; upload later |
| AD-06 | Inventory management | P0 | Stock by variant; IN/OUT/ADJUSTMENT ledger |
| AD-07 | Low-stock alerts | P1 | Threshold per variant or global |
| AD-08 | Orders list + status updates | P0 | PENDING → CONFIRMED → SHIPPED → DELIVERED / CANCELLED |
| AD-09 | Order detail (line items, customer, address) | P0 | |
| AD-10 | Categories management | P1 | Or keep category as string + curated list |
| AD-11 | Customers list (read-only) | P2 | |
| AD-12 | Seed / bulk import products | P1 | From existing `data.ts` / generator |

### 5.3 Platform / engineering

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| PL-01 | Align Prisma schema with frontend product needs | P0 | brand, slug, badge, originalPrice, features, subcategory, isActive |
| PL-02 | API layer for products, cart, orders, inventory | P0 | |
| PL-03 | Seed script with real tee catalog | P0 | |
| PL-04 | SessionProvider + auth helpers | P0 | |
| PL-05 | Admin layout (desktop-first; storefront stays mobile-first) | P0 | |
| PL-06 | Error/toast UX (sonner already installed) | P1 | |
| PL-07 | Address model on User/Order | P0 | Missing from schema today |
| PL-08 | Payment stub (COD / “mark paid”) | P0 | Real gateway = post-MVP |
| PL-09 | Activate middleware for `/admin/*` | P0 | Rename/wire `proxy.ts` correctly for Next 16 |

---

## 6. Data model changes (required)

Existing models: `User`, `Product`, `ProductImage`, `ProductVariant`, `Cart`, `CartItem`, `Order`, `OrderItem`, `InventoryTransaction`.

### Add / extend

**Product** — add fields the storefront already expects:

- `slug` (unique), `brand`, `subcategory`, `originalPrice?`, `badge?`, `features` (string[] / Json), `rating` (default), `reviewCount` (default), `isActive`, `isFeatured`

**Address** (new):

- `userId`, `label`, `line1`, `line2?`, `city`, `state`, `postalCode`, `phone`, `isDefault`

**Order** — extend:

- `shippingAddress` (Json snapshot or FK), `shippingFee`, `subtotal`, `discount`, `paymentMethod` (`COD` | `ONLINE_STUB`), `paymentStatus`

**Wishlist** (new, P1):

- `userId` + `productId` unique pair

**InventoryTransaction** — already fits; admin must create rows on stock changes and checkout must create `OUT` rows.

### Type alignment

Introduce a shared mapper: Prisma product (+ images + variants) → frontend `Product` shape so UI components stay mostly unchanged.

---

## 7. User flows

### 7.1 Browse → buy (happy path)

1. Guest lands on `/` → sees seeded products.
2. Opens `/shop` or category → filters → product detail.
3. Selects color + size (in-stock only) → Add to cart.
4. Opens `/cart` → Checkout.
5. If guest → login/register → cart merged.
6. Selects/adds address → confirms shipping → Place order (COD/stub).
7. Stock decremented; inventory `OUT` logged; order `PENDING`.
8. Confirmation page + appears under My Orders.

### 7.2 Admin restock

1. Admin logs in → `/admin`.
2. Inventory → select variant → Adjust (+N) with note.
3. Stock updates; `IN` or `ADJUSTMENT` transaction recorded.
4. Low-stock list updates.

### 7.3 Admin fulfill

1. Orders → open order → Confirm → Ship → Deliver.
2. Cancel restores stock (`IN` / reverse) when cancelled before ship.

---

## 8. Admin dashboard IA

```
/admin
  /admin                    Overview
  /admin/products           Product list
  /admin/products/new       Create
  /admin/products/[id]      Edit + variants + images
  /admin/inventory          Stock table + adjustments
  /admin/orders             Order list
  /admin/orders/[id]        Order detail + status
  /admin/customers          (P2)
```

Desktop layout: sidebar + content. Do **not** reuse the mobile floating nav.

---

## 9. API surface (target)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/products` | public | List + filters |
| GET | `/api/products/[id]` | public | Detail |
| POST | `/api/register` | public | Sign up |
| * | `/api/auth/[...nextauth]` | — | NextAuth |
| GET/POST/PATCH/DELETE | `/api/cart` | customer | Cart CRUD |
| POST | `/api/checkout` | customer | Create order |
| GET | `/api/orders` | customer | My orders |
| GET | `/api/orders/[id]` | customer | Order detail |
| * | `/api/admin/products` | admin | Full CRUD |
| * | `/api/admin/inventory` | admin | Adjust stock |
| * | `/api/admin/orders` | admin | List + status |
| GET | `/api/admin/stats` | admin | Dashboard metrics |

All admin routes must verify `session.user.role === "ADMIN"`.

---

## 10. UX / design constraints

- Preserve existing storefront visual language (mobile-first, `max-w-lg`, framer-motion, theme tokens).
- Prefer wiring data over redesigning pages.
- Admin may use a denser, desktop-first layout; still respect brand colors/fonts.
- Use `sonner` for success/error toasts.
- No payment gateway UI complexity in MVP — clear COD / “Pay on delivery” path.

---

## 11. Success criteria (MVP done when)

1. DB seeded with ≥15 t-shirt products with multi-size/color variants and stock.
2. Storefront pages no longer import mock products for catalog (helpers may remain for constants only).
3. User can register, login, logout; profile shows real identity.
4. User can complete COD checkout; order appears in My Orders; stock decreases.
5. Admin can create/edit products, adjust inventory, and move order statuses.
6. Unauthenticated users cannot access `/admin/*`.
7. Free-shipping threshold still works against real cart totals.

---

## 12. Risks & decisions

| Risk / decision | Recommendation |
|-----------------|----------------|
| Schema vs mock Product mismatch | Extend schema + mapper; don’t rewrite every component |
| Payments | MVP = COD; abstract `paymentMethod` for later Razorpay |
| Guest checkout | Require auth at checkout (simpler) |
| Image hosting | URLs first (Shopify CDN already in mock); upload later |
| NextAuth v4 on Next 16 | Keep current setup; fix SessionProvider + middleware |
| `proxy.ts` vs middleware | Confirm Next 16 convention in `AGENTS.md` / docs and wire correctly |
| Empty Caps / Racing Club categories | Seed some products or hide empty categories |

---

## 13. How to use this PRD with the coding agent

Work **one sprint at a time** (see `docs/SPRINT_PLAN.md`). When prompting, include:

1. Sprint ID + goal  
2. “Follow `docs/PRD.md` and `docs/SPRINT_PLAN.md`”  
3. Acceptance criteria from that sprint  
4. Constraints: preserve storefront UI; no drive-by refactors  

Example:

> Implement Sprint 2 from `docs/SPRINT_PLAN.md`. Wire the shop, home, product detail, and category pages to `GET /api/products` instead of `src/lib/data.ts`. Keep existing UI. Meet the sprint acceptance criteria.
