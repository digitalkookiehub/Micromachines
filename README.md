# MicroMachines

> Dual-pricing e-commerce platform for computer peripherals distributors.

One storefront, two audiences. Retail customers see MRP and nothing else. Approved dealers log in and the same catalogue re-prices itself — wholesale rates, savings per item, tier-based credit terms, and GST invoices. The price split is enforced on the server: a customer response never contains a dealer price.

---

## Features

**Dual pricing (the core rule)**
- Anonymous & customer responses carry only `price` (MRP) — no dealer fields, no B2B terminology
- Approved dealers get `price` (dealer rate), `mrp`, `savings_percent`, `savings_amount`
- Per-dealer `special_discount` applied server-side on top of the dealer rate
- Serialization is centralised in `serialize_product_for_role()` — the frontend never chooses a price

**Catalogue**
- 6 categories (mouse, keyboard, monitor, headset, storage, accessories), brands, HSN codes, stock tracking
- Meilisearch-backed search with category filtering
- AI-assisted product upload for dealers: image → draft → AI-generated description/specs → review → publish
- Two AI backends: OpenAI Vision, or a local Ollama model (`gemma3:4b`) for description generation

**Orders, payments & credit**
- Cart → checkout → order with server-side pricing and stock checks
- Razorpay payments with webhook confirmation
- **Pay Later credit for dealers** — credit limit, tier-based terms (silver 30 / gold 60 / platinum 90 days), automatic due dates, per-order credit transactions, admin settlement

**GST invoicing**
- Same state → CGST 9% + SGST 9%; different state → IGST 18%
- Per-item HSN codes, sequential invoice numbers, PDF download

**Roles & admin**
- `customer`, `dealer`, `admin` — JWT in HTTP-only cookies, rate-limited login
- Dealer signup requires admin approval before wholesale pricing unlocks
- Admin console: users, dealer approval/rejection, special discounts, credit limits, outstanding credit and settlement, orders, product moderation

---

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | FastAPI, Python 3.11+, SQLAlchemy, Alembic, Pydantic v2 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Framer Motion |
| Database | PostgreSQL 15 |
| Auth | Email/password + JWT in HTTP-only cookies |
| Search | Meilisearch |
| Payments | Razorpay |
| Async | Celery + Redis |
| AI | OpenAI GPT-4 Vision / local Ollama |
| Storage | AWS S3 / Cloudinary |

---

## Quick Start

### 1. Services

```bash
cp .env.example .env          # fill in secrets
docker-compose up -d db redis meilisearch
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed_data.py           # admin, dealer, customer + sample products
python seed_more.py           # optional: more catalogue data
python index_products.py      # push catalogue into Meilisearch
uvicorn app.main:app --reload
```

API at `http://localhost:8000` — interactive docs at `/docs`, health check at `/health`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App at `http://localhost:5173`.

### 4. Celery worker (invoice PDFs, emails, AI tasks)

```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

### Everything in Docker

```bash
docker-compose up -d                                          # full stack, frontend on :3000
docker-compose -f docker-compose.dev.yml up                    # hot-reload dev variant
```

### Seeded accounts (local development only)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@micromachines.in` | `admin123` |
| Dealer (approved) | `dealer@example.com` | `dealer123` |
| Customer | `customer@example.com` | `customer123` |

Log in as the dealer and the same product pages switch to wholesale pricing — that's the fastest way to see the dual-pricing rule working.

---

## API

All endpoints are prefixed with `/api/v1/`.

| Group | Endpoints |
|---|---|
| `/auth` | `register`, `login`, `refresh`, `logout`, `GET/PUT /me` |
| `/products` | list, `search`, `{slug}`, create/update/delete, `categories`, `brands`, `upload-image`, `draft/{id}` (+ `publish`), `ai/generate-description`, `ai/status` |
| `/cart` | get cart, `POST /items`, `PUT/DELETE /items/{id}` |
| `/orders` | create, list, `{id}`, `{id}/pay`, `webhook` |
| `/invoices` | `generate/{order_id}`, list, `{id}`, `{id}/pdf` |
| `/credit` | `summary`, `transactions` |
| `/admin` | `stats`, `users`, `dealers` (+ approve/reject/discount/credit-limit), `credit/outstanding`, `credit/transactions/{id}/settle`, `orders`, `products` |
| `/dashboard` | `stats` (role-aware) |

Status codes: `200` OK · `201` Created · `400` Bad Request · `401` Unauthorized · `403` Wrong role · `404` Not Found · `409` Conflict · `429` Rate limited.

---

## Project Structure

```
micromachines/
├── backend/
│   ├── app/
│   │   ├── main.py, config.py, database.py, exceptions.py, utils.py
│   │   ├── models/       user, product, cart, order, invoice, credit
│   │   ├── schemas/      role-based serialization lives in product.py
│   │   ├── routers/      auth, products, cart, orders, invoices, credit, admin, dashboard
│   │   ├── services/     ai_vision, ai_local, web_scraper, payment,
│   │   │                 invoice_generator, search, storage, email
│   │   ├── auth/         jwt.py, dependencies.py
│   │   └── tasks/        celery_app.py, product_tasks.py
│   ├── alembic/          5 migrations
│   ├── tests/            45 tests
│   └── seed_data.py, seed_more.py, index_products.py, update_images.py
├── frontend/src/
│   ├── pages/            storefront, cart, checkout, orders, invoices,
│   │                     dashboard, credit, admin/ (6 pages)
│   ├── components/       ProductCard, SearchBar, CategoryTabs, layout/, ui/
│   ├── services/         typed API clients per domain
│   ├── context/          AuthContext
│   ├── hooks/            useAuth, useCart, useOrders, useProducts
│   └── types/
├── docker-compose.yml, docker-compose.dev.yml
├── CLAUDE.md             project rules for Claude Code
├── INITIAL.md            product definition
├── PRPs/                 implementation blueprint
├── skills/               code patterns (backend, frontend, database, testing, deployment)
└── agents/               agent definitions
```

---

## Environment Variables

See `.env.example` for the full list. Essentials:

```env
DATABASE_URL=postgresql://micromachines:password@localhost:5432/micromachines
SECRET_KEY=change-me-in-production-use-openssl-rand-hex-32
REDIS_URL=redis://localhost:6379/0
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey123

OPENAI_API_KEY=sk-...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

SELLER_STATE=Maharashtra        # drives CGST+SGST vs IGST
SELLER_GSTIN=...
DEFAULT_GST_RATE=18
```

Frontend (`frontend/.env`): `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`.

---

## Testing & Linting

```bash
cd backend && pytest tests -v      # 45 tests: auth, products, cart, orders, invoices, admin
ruff check backend/

cd frontend && npm run lint
npm run build                      # type-checks via tsc -b
```

---

## Known Gaps

- `services/web_scraper.py` returns placeholder specs — wire up SerpAPI or Google Custom Search for real spec enrichment
- No frontend test suite yet
- CI workflow exists locally at `.github/workflows/ci.yml` but is gitignored (pushing it needs the GitHub `workflow` OAuth scope)

---

## Development Notes

Rules that must hold when changing code — the full set is in `CLAUDE.md`:

- Never return both prices from an API response; route everything through role-based serialization
- JWT in HTTP-only cookies only, never `localStorage` or the response body
- Backend-enforced pricing — never trust a price sent by the client
- No dealer/wholesale/B2B terminology anywhere an unauthenticated visitor can see it
- Invoice numbers are sequential — never skipped, never reused
- Type hints on all Python; no `any` in TypeScript
