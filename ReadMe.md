# Mini ERP/CRM Operations Portal

A small ERP/CRM system for a wholesale distribution company — customers, product/inventory, and a sales challan workflow with automated stock validation. Built as a technical case study.

**Live:**
- Frontend: `https://<your-vercel-url>.vercel.app`
- Backend API: `https://<your-render-url>.onrender.com`
- Health check: `https://<your-render-url>.onrender.com/health`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| ORM / DB | Prisma + PostgreSQL (Supabase) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Validation | Zod |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| Charts | Recharts |
| Deployment | Vercel (frontend) · Render (backend) · Supabase (database) |

---

## Architecture, in short

Flat two-folder repo (`frontend/`, `backend/`) rather than a monorepo — the scope didn't need shared workspace tooling, and it's simpler to set up and explain.

**Backend** is organized by module (`auth`, `customers`, `products`, `inventory`, `challans`, `dashboard`), each with `controller` / `service` / `validator` / `routes`. `middleware/` holds JWT verification, role-based access control, request validation, and centralized error handling. All business logic lives in the `service` layer; controllers stay thin.

**Frontend** is a Vite SPA with role-gated routing (`ProtectedRoute`), a shared `AuthContext` for the JWT/user, and pages organized per module.

**Core business logic** — the part most worth reading if reviewing this quickly — is `backend/src/modules/challans/challan.service.ts`, specifically `confirmChallan`. Confirming a challan runs inside a single Prisma `$transaction`: it validates every line item against live stock, decrements stock per item, writes a `stock_movements` row per item, and flips the challan to `CONFIRMED` — all atomically, so a partial failure can't leave stock and challan status out of sync. Challan line items also **snapshot** product name/SKU/price at the moment they're added, so later product edits never retroactively change historical challans.

---

## Database Schema

8 Prisma models: `User`, `Customer`, `CustomerFollowup`, `Product`, `StockMovement`, `Challan`, `ChallanItem`, `Counter` (used for gapless-enough sequential challan numbering, e.g. `CH-000001`).

---

## Roles & Access

| Role | Access |
|---|---|
| Admin | Everything |
| Sales | Dashboard, Customers, Challans |
| Warehouse | Dashboard, Products/Inventory |
| Accounts | Dashboard, Customers, Challans |

Enforced in two layers: the frontend nav hides pages a role shouldn't see, and every API route is also protected server-side via `verifyJWT` + `requireRole` middleware — so access control can't be bypassed by calling the API directly.

### Test credentials
All seeded users share the password `Password123!`:
- `admin@mini-erp.test`
- `sales@mini-erp.test`
- `warehouse@mini-erp.test`
- `accounts@mini-erp.test`

---

## API Overview

```
POST   /auth/login

GET/POST   /customers            GET/PUT /customers/:id
POST       /customers/:id/followups

GET/POST   /products             GET/PUT /products/:id

GET        /inventory/movements
POST       /inventory/stock-in

GET/POST   /challans             GET/PUT /challans/:id
POST       /challans/:id/confirm

GET        /dashboard/sales-overview
GET        /health
```

All list endpoints support `page`/`limit` pagination plus relevant search/filter query params. Validation errors return `400` with field-level details (Zod). Auth/role failures return `401`/`403`. Business-rule conflicts (e.g. insufficient stock) return `409` with a structured `details` object.

A full Postman collection is included at `backend/postman/collection.json` — import it, run the **Login** request first (it auto-saves the JWT into a collection variable), then run the rest in order.

---

## Running Locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Supabase free tier works — use the **Session Pooler** connection string, not the direct connection, for IPv4 compatibility)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in DATABASE_URL and JWT_SECRET in .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
API runs on `http://localhost:4000`. Confirm with `GET /health`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# set VITE_API_URL=http://localhost:4000
npm run dev
```
App runs on `http://localhost:5173`.

---

## Environment Variables

**`backend/.env`**
```
DATABASE_URL=       # Postgres connection string (Supabase session pooler recommended)
JWT_SECRET=          # long random string
JWT_EXPIRES_IN=8h
FRONTEND_URL=        # deployed frontend URL, for CORS (defaults to localhost:5173)
PORT=                # leave unset locally; hosting platforms (Render) inject this automatically
```

**`frontend/.env`**
```
VITE_API_URL=        # backend base URL, e.g. http://localhost:4000 or the Render URL
```

None of these are committed — `.env.example` files in both folders document the required keys without real values.

---

## Deployment

- **Database:** Supabase Postgres, connected via the Session Pooler string (IPv4-compatible; the direct connection host requires IPv6, which isn't reliably available on free hosting tiers).
- **Backend:** Render web service, root directory `backend`.
  - Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
  - Start: `npm run start`
  - Env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`
- **Frontend:** Vercel, root directory `frontend`.
  - Build: `npm run build` (default) · Output: `dist` (default)
  - Env var: `VITE_API_URL` pointed at the Render URL
  - Includes `vercel.json` with a SPA rewrite (`/(.*) → /index.html`) so client-side routes don't 404 on refresh.

Render's free tier cold-starts after inactivity — first request after idle can take 30–60 seconds.

---

## Assumptions Made

- No login/signup UI for creating new users — roles are seeded directly via `prisma/seed.ts`, since the PRD only requires role-based access to already exist, not self-service account creation.
- "Confirm challan" is treated as a one-way action in this MVP — there's no un-confirm/cancel-after-confirm flow, since the PRD doesn't specify reversal behavior and it wasn't core to the required workflow.
- Currency formatting defaults to INR given the business context (wholesale/distribution), though this isn't explicitly specified in the PRD.
- "Reason" is required (not optional) on manual stock-in entries, to keep the movement log meaningfully auditable.

## Known Limitations

- No purchase order / vendor invoice module — this case study's core modules are scoped to the customer/sales side (Auth, CRM, Inventory, Sales Challan) per the PRD; purchasing was not a required module.
- The challan builder has a UI-only "notes" field that isn't currently persisted — the `Challan` schema doesn't have a notes column yet.
- No automated test suite — given the 48-hour window, manual verification (documented smoke-test flow below) was prioritized over test coverage.
- Render free tier cold starts, as noted above.
- No file/image upload (e.g. product images) — listed as a bonus item in the PRD, not implemented here.

---

## Manual Smoke Test (what was verified before submission)

1. Log in as Sales → create a customer → add a follow-up note
2. Create a draft challan → attempt to confirm with quantity exceeding stock → verify the inline 409 error names the correct product
3. Correct the quantity → confirm succeeds → challan status flips to Confirmed
4. Log in as Warehouse → verify Sales/CRM nav is hidden → verify the stock movement log shows an OUT entry referencing the challan number, and current stock decreased by the confirmed quantity
5. Verify direct URL navigation to a restricted route (e.g. Warehouse user visiting `/challans`) redirects to the dashboard
6. Verify the same 403 behavior via Postman using a Warehouse token against a Sales-only endpoint
