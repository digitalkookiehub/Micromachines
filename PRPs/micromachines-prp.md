# PRP: MicroMachines

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | MicroMachines |
| **Type** | SaaS — B2B + B2C Hybrid |
| **Version** | 1.0 |
| **Created** | 2026-03-15 |
| **Complexity** | High |

---

## PRODUCT OVERVIEW

**Description:** A dual-pricing e-commerce platform for Indian computer peripherals distributors. Single storefront serves two segments — clean consumer experience with MRP pricing for anonymous visitors, and wholesale experience with dealer pricing, savings indicators, and AI-powered product upload for authenticated dealers.

**Value Proposition:** Reduces product listing time from 10+ minutes to under 60 seconds via AI-powered image recognition and auto-fill. Unified platform eliminates need for separate B2B and B2C storefronts. GST-compliant invoicing out of the box.

**MVP Scope:**
- [ ] User registration/login with JWT in HTTP-only cookies
- [ ] Dealer vs Customer role-based access control
- [ ] Dual-pricing storefront (backend-enforced, role-based API responses)
- [ ] Product catalog with Meilisearch, category filters, low stock indicators
- [ ] AI-powered product upload (OpenAI GPT-4 Vision + web scraping)
- [ ] Shopping cart and order flow with Razorpay payments
- [ ] GST-compliant invoicing (CGST/SGST/IGST + HSN codes)
- [ ] Admin panel with dealer approval workflow
- [ ] Email notifications (order confirmation, dealer approval)
- [ ] Role-based dashboard

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + TypeScript + Vite | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy | skills/DATABASE.md |
| Auth | Email/Password + JWT (HTTP-only cookies) | skills/BACKEND.md |
| UI | Tailwind CSS + shadcn/ui | skills/FRONTEND.md |
| Payments | Razorpay | skills/BACKEND.md |
| Search | Meilisearch | skills/BACKEND.md |
| AI | OpenAI GPT-4 Vision | skills/BACKEND.md |
| Async | Celery + Redis | skills/BACKEND.md |
| Storage | AWS S3 / Cloudinary | skills/DEPLOYMENT.md |
| Testing | pytest + React Testing Library | skills/TESTING.md |
| Deployment | Docker + docker-compose | skills/DEPLOYMENT.md |

---

## DATABASE MODELS

### User Model
```
User:
  - id: int (PK, auto)
  - email: str (unique, indexed)
  - hashed_password: str
  - full_name: str
  - phone: str (nullable)
  - role: enum (customer/dealer/admin), default=customer
  - is_active: bool, default=True
  - is_verified: bool, default=False
  - created_at: datetime
  - updated_at: datetime
  Relations: has_one DealerProfile, has_many RefreshToken, has_many Order, has_many Product (created_by)
```

### DealerProfile Model
```
DealerProfile:
  - id: int (PK, auto)
  - user_id: int (FK → User, unique)
  - company_name: str
  - dealer_id: str (unique, display ID e.g. "DLR-0001")
  - gst_number: str (nullable)
  - tier: enum (silver/gold/platinum), default=silver — future use
  - credit_limit: decimal, default=0
  - is_approved: bool, default=False
  - approved_by: int (FK → User, nullable)
  - approved_at: datetime (nullable)
  Relations: belongs_to User
```

### RefreshToken Model
```
RefreshToken:
  - id: int (PK, auto)
  - user_id: int (FK → User)
  - token: str (unique, indexed)
  - expires_at: datetime
  - revoked: bool, default=False
  - created_at: datetime
  Relations: belongs_to User
```

### Product Model
```
Product:
  - id: int (PK, auto)
  - name: str (indexed)
  - slug: str (unique, indexed)
  - brand: str (indexed)
  - sku: str (unique)
  - hsn_code: str
  - category: enum (mouse/keyboard/monitor/headset/storage/accessories)
  - description: text
  - specifications: JSONB
  - customer_price: decimal (MRP)
  - dealer_price: decimal
  - stock_quantity: int, default=0
  - image_url: str
  - thumbnail_url: str (nullable)
  - is_active: bool, default=True
  - created_by: int (FK → User)
  - created_at: datetime
  - updated_at: datetime
  Relations: belongs_to User (created_by), has_many CartItem, has_many OrderItem
```

### ProductDraft Model
```
ProductDraft:
  - id: int (PK, auto)
  - dealer_id: int (FK → User)
  - image_url: str
  - ai_detected_data: JSONB (nullable)
  - web_scraped_data: JSONB (nullable)
  - final_data: JSONB (nullable)
  - status: enum (processing/review/published/failed), default=processing
  - created_at: datetime
  - updated_at: datetime
  Relations: belongs_to User (dealer)
```

### Category Model
```
Category:
  - id: int (PK, auto)
  - name: str (unique)
  - slug: str (unique)
  - display_order: int, default=0
  - is_active: bool, default=True
```

### Brand Model
```
Brand:
  - id: int (PK, auto)
  - name: str (unique)
  - logo_url: str (nullable)
  - is_active: bool, default=True
```

### Cart Model
```
Cart:
  - id: int (PK, auto)
  - user_id: int (FK → User, nullable)
  - session_id: str (nullable, for guest carts)
  - created_at: datetime
  - updated_at: datetime
  Relations: belongs_to User, has_many CartItem
```

### CartItem Model
```
CartItem:
  - id: int (PK, auto)
  - cart_id: int (FK → Cart)
  - product_id: int (FK → Product)
  - quantity: int, default=1
  - price_at_add: decimal (price snapshot)
  - created_at: datetime
  Relations: belongs_to Cart, belongs_to Product
```

### Order Model
```
Order:
  - id: int (PK, auto)
  - order_number: str (unique, auto-generated e.g. "ORD-20260315-0001")
  - user_id: int (FK → User)
  - status: enum (pending/confirmed/processing/shipped/delivered/cancelled), default=pending
  - subtotal: decimal
  - tax_amount: decimal
  - total: decimal
  - shipping_address: JSONB
  - billing_address: JSONB
  - payment_id: str (nullable, Razorpay payment ID)
  - payment_status: enum (pending/paid/failed/refunded), default=pending
  - notes: text (nullable)
  - created_at: datetime
  - updated_at: datetime
  Relations: belongs_to User, has_many OrderItem, has_one Invoice
```

### OrderItem Model
```
OrderItem:
  - id: int (PK, auto)
  - order_id: int (FK → Order)
  - product_id: int (FK → Product)
  - product_name: str (snapshot)
  - quantity: int
  - unit_price: decimal
  - total_price: decimal
  - hsn_code: str
  Relations: belongs_to Order, belongs_to Product
```

### Invoice Model
```
Invoice:
  - id: int (PK, auto)
  - invoice_number: str (unique, sequential e.g. "INV-2026-0001")
  - order_id: int (FK → Order, unique)
  - user_id: int (FK → User)
  - billing_name: str
  - billing_address: JSONB
  - gstin: str (nullable, dealer's GST number)
  - subtotal: decimal
  - cgst_amount: decimal, default=0
  - sgst_amount: decimal, default=0
  - igst_amount: decimal, default=0
  - total_tax: decimal
  - total_amount: decimal
  - place_of_supply: str
  - is_igst: bool, default=False (True if inter-state)
  - pdf_url: str (nullable)
  - created_at: datetime
  Relations: belongs_to Order, belongs_to User, has_many InvoiceItem
```

### InvoiceItem Model
```
InvoiceItem:
  - id: int (PK, auto)
  - invoice_id: int (FK → Invoice)
  - product_name: str
  - hsn_code: str
  - quantity: int
  - unit_price: decimal
  - taxable_amount: decimal
  - cgst_rate: decimal, default=9.0
  - cgst_amount: decimal, default=0
  - sgst_rate: decimal, default=9.0
  - sgst_amount: decimal, default=0
  - igst_rate: decimal, default=18.0
  - igst_amount: decimal, default=0
  - total: decimal
  Relations: belongs_to Invoice
```

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/register | Create account (customer or dealer) | Public |
| POST | /api/v1/auth/login | Login, set JWT in HTTP-only cookie | Public |
| POST | /api/v1/auth/refresh | Refresh access token | Cookie |
| POST | /api/v1/auth/logout | Revoke token, clear cookie | Cookie |
| GET | /api/v1/auth/me | Get current user profile + role | Auth |
| PUT | /api/v1/auth/me | Update profile info | Auth |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| (modal) | LoginModal | LoginForm, PasswordInput, ForgotPasswordLink |
| /register | RegisterPage | RegisterForm, RoleSelector (customer/dealer), DealerFields |
| /forgot-password | ForgotPasswordPage | EmailInput, ResetForm |
| /profile | ProfilePage | ProfileForm, DealerProfileCard |

**Key Implementation Details:**
- Login via modal overlay triggered by header "Login" button — NOT a separate page
- Registration page: if dealer selected, show additional fields (company_name, gst_number)
- Dealer accounts are created with `is_approved=False`, require admin approval
- JWT access token (30 min) set as HTTP-only cookie, refresh token (7 days) in DB
- Rate limit: 5 login attempts per minute per IP (use slowapi)
- Password hashing: bcrypt via passlib

---

### Module 2: Product Catalog
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/products | List products with pagination, filters | Public |
| GET | /api/v1/products/{slug} | Product detail | Public |
| GET | /api/v1/products/search?q= | Full-text search via Meilisearch | Public |
| GET | /api/v1/products/categories | List active categories | Public |
| GET | /api/v1/products/brands | List active brands | Public |
| POST | /api/v1/products | Create product manually | Dealer |
| PUT | /api/v1/products/{id} | Update product | Owner/Admin |
| DELETE | /api/v1/products/{id} | Soft delete product | Owner/Admin |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| / | HomePage (Catalog) | ProductGrid, ProductCard, CategoryTabs, SearchBar, LowStockBadge |
| /products/{slug} | ProductDetailPage | ProductImage, SpecsTable, PriceDisplay, AddToCartButton, BrandBadge |

**CRITICAL — Role-Based Price Serialization:**
```python
# Backend serializer logic (pseudo-code)
def serialize_product(product, user_role):
    base = {id, name, slug, brand, category, description, specs, image_url, stock_quantity}
    if user_role == "dealer" and dealer.is_approved:
        return {**base, price: dealer_price, mrp: customer_price,
                savings_percent: ((mrp - price) / mrp * 100),
                savings_amount: mrp - price, is_dealer: True}
    else:
        return {**base, price: customer_price, tax_label: "Inclusive of all taxes"}
```

**Frontend Card Variants:**
- **Customer card:** Price (MRP), "Inclusive of all taxes" label, "Add to Cart" button
- **Dealer card:** Dealer price (primary), ~~MRP~~ strikethrough, "Save X%" badge, "DEALER PRICE" ribbon, "Add to Order" button

---

### Module 3: AI Product Upload
**Agents:** BACKEND-AGENT + FRONTEND-AGENT + DEVOPS-AGENT (Celery setup)

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/products/upload-image | Upload image, trigger AI pipeline | Dealer |
| GET | /api/v1/products/draft/{id} | Get draft with AI results | Dealer (owner) |
| PUT | /api/v1/products/draft/{id} | Update draft fields | Dealer (owner) |
| POST | /api/v1/products/draft/{id}/publish | Publish draft as Product | Dealer (owner) |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /products/add | AIProductUploadPage | ImageDropzone, AIProcessingSpinner, ProductDraftForm, EditToggle, MarginCalculator, SpecsEditor, CategoryDropdown |

**AI Pipeline (Celery Task):**
```
1. POST /upload-image → save image to S3 → create ProductDraft (status=processing) → return draft_id
2. Celery task: send image to OpenAI GPT-4 Vision API
   Prompt: "Analyze this computer peripheral product image. Return JSON with: product_type, brand, model, category, visible_features[]"
3. Celery task: web search for "{brand} {model} specifications"
   Extract: full description, detailed specs (e.g., DPI, connectivity, weight, dimensions)
4. Merge AI + web data → update ProductDraft (status=review)
5. Frontend polls GET /draft/{id} until status=review → display auto-filled form
6. Dealer reviews → edits → sets customer_price + dealer_price → publishes
```

**Margin Calculator Component:**
```
Customer Price (MRP): ₹[input]
Dealer Price:         ₹[input]
─────────────────────────────
Margin:               ₹[calculated] ([%] margin)
```

---

### Module 4: Orders & Cart
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/cart | Get current user's cart | Auth |
| POST | /api/v1/cart/items | Add item to cart | Auth |
| PUT | /api/v1/cart/items/{id} | Update quantity | Auth |
| DELETE | /api/v1/cart/items/{id} | Remove item from cart | Auth |
| POST | /api/v1/orders | Create order from cart | Auth |
| GET | /api/v1/orders | List user's orders | Auth |
| GET | /api/v1/orders/{id} | Get order detail | Auth (owner) |
| POST | /api/v1/orders/{id}/pay | Create Razorpay order + return payment link | Auth (owner) |
| POST | /api/v1/orders/webhook | Razorpay payment webhook | Webhook signature |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /cart | CartPage | CartItemList, CartItem, QuantitySelector, CartSummary, ProceedButton |
| /checkout | CheckoutPage | AddressForm, OrderSummary, RazorpayButton, PaymentStatus |
| /orders | OrdersPage | OrderList, OrderCard, StatusBadge |
| /orders/{id} | OrderDetailPage | OrderHeader, OrderItems, StatusTracker, InvoiceLink |

**Payment Flow:**
```
1. User fills cart → clicks "Proceed to Checkout"
2. /checkout → fill address → click "Pay with Razorpay"
3. POST /orders → create Order (status=pending) → POST /orders/{id}/pay → Razorpay order created
4. Frontend opens Razorpay checkout modal
5. User completes payment → Razorpay sends webhook → POST /orders/webhook
6. Verify Razorpay signature → update Order (status=confirmed, payment_status=paid)
7. Trigger invoice generation (Celery) + send confirmation email
```

**Cart Price Enforcement:**
- `price_at_add` snapshots the role-appropriate price when item is added
- On checkout, re-validate all prices against current role and current product prices
- If price changed, notify user before proceeding

---

### Module 5: GST Invoicing
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/invoices/generate/{order_id} | Generate invoice after payment | System/Auth |
| GET | /api/v1/invoices | List user's invoices | Auth |
| GET | /api/v1/invoices/{id} | Invoice detail | Auth (owner) |
| GET | /api/v1/invoices/{id}/pdf | Download invoice as PDF | Auth (owner) |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /invoices | InvoicesPage | InvoiceList, InvoiceRow, StatusBadge |
| /invoices/{id} | InvoiceDetailPage | InvoiceHeader, InvoiceMeta, LineItemsTable, TaxBreakdown, TotalSection, DownloadButton, PrintButton |

**GST Calculation Logic:**
```python
def calculate_gst(taxable_amount: Decimal, seller_state: str, buyer_state: str, cgst_rate=9, sgst_rate=9, igst_rate=18):
    if seller_state == buyer_state:
        # Intra-state: CGST + SGST
        cgst = taxable_amount * cgst_rate / 100
        sgst = taxable_amount * sgst_rate / 100
        return {"cgst": cgst, "sgst": sgst, "igst": 0, "total_tax": cgst + sgst}
    else:
        # Inter-state: IGST
        igst = taxable_amount * igst_rate / 100
        return {"cgst": 0, "sgst": 0, "igst": igst, "total_tax": igst}
```

**Invoice PDF Generation (Celery):**
- Use ReportLab or WeasyPrint for PDF generation
- Template: company header, invoice number, date, buyer/seller details, line items with HSN, tax breakdown, total
- Store PDF in S3, save URL in Invoice.pdf_url
- Sequential invoice numbering: `INV-{YEAR}-{SEQUENCE:04d}`

---

### Module 6: Admin Panel
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/admin/users | List all users (paginated, filterable) | Admin |
| PUT | /api/v1/admin/users/{id} | Update user status/role | Admin |
| GET | /api/v1/admin/dealers | List dealer applications | Admin |
| POST | /api/v1/admin/dealers/{id}/approve | Approve dealer, send email | Admin |
| POST | /api/v1/admin/dealers/{id}/reject | Reject dealer, send email | Admin |
| GET | /api/v1/admin/stats | Platform stats (users, orders, revenue, products) | Admin |
| GET | /api/v1/admin/orders | List all orders | Admin |
| GET | /api/v1/admin/products | List all products | Admin |
| PUT | /api/v1/admin/products/{id} | Moderate product (activate/deactivate) | Admin |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /admin | AdminDashboard | StatCards (users, dealers, orders, revenue), RecentOrders, PendingDealers |
| /admin/users | AdminUsersPage | UsersTable, UserFilters, RoleBadge, StatusToggle |
| /admin/dealers | AdminDealersPage | DealerQueue, DealerCard, ApproveButton, RejectButton |
| /admin/orders | AdminOrdersPage | OrdersTable, OrderFilters, StatusDropdown |
| /admin/products | AdminProductsPage | ProductsTable, ProductFilters, ActiveToggle |

---

### Module 7: Dashboard
**Agents:** FRONTEND-AGENT + BACKEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/dashboard/stats | Role-based dashboard stats | Auth |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /dashboard | DashboardPage | CustomerDashboard OR DealerDashboard (based on role) |

**Customer Dashboard:** RecentOrders, SavedAddresses, AccountInfo
**Dealer Dashboard:** StatCards (products, orders, revenue), RecentDealerOrders, QuickActions (+ Add Product), TierInfo

---

## PHASE EXECUTION PLAN

### Phase 1: Foundation (4 agents in parallel)

**DATABASE-AGENT:**
- Create all SQLAlchemy models (User, DealerProfile, RefreshToken, Product, ProductDraft, Category, Brand, Cart, CartItem, Order, OrderItem, Invoice, InvoiceItem)
- Set up database.py with async session
- Create Alembic migrations
- Seed default categories and sample data
- Files: `backend/app/models/*.py`, `backend/app/database.py`, `alembic/`

**BACKEND-AGENT:**
- Set up FastAPI project structure (main.py, config.py)
- Configure CORS, middleware, exception handlers
- Set up Pydantic settings with environment variables
- Create base router structure
- Files: `backend/app/main.py`, `backend/app/config.py`, `backend/requirements.txt`

**FRONTEND-AGENT:**
- Vite + React + TypeScript project setup
- Tailwind CSS + shadcn/ui configuration
- Folder structure (components, pages, hooks, services, context, types)
- Base layout: Header (logo, search, Login button, nav), Footer
- AuthContext provider skeleton
- React Router setup with all routes
- Files: `frontend/src/**`, `frontend/package.json`, `frontend/tailwind.config.js`

**DEVOPS-AGENT:**
- docker-compose.yml (PostgreSQL, Redis, Meilisearch, backend, frontend, celery worker)
- Dockerfile for backend and frontend
- .env.example with all variables
- Celery configuration (celery_app.py)
- S3/Cloudinary upload utility
- Files: `docker-compose.yml`, `Dockerfile.*`, `.env.example`, `backend/app/tasks/celery_app.py`

**Validation Gate 1:**
```bash
pip install -r backend/requirements.txt
alembic upgrade head
npm install --prefix frontend
docker-compose config
```

---

### Phase 2: Core Modules (sequential, backend before frontend)

**Phase 2A: Auth Module**

BACKEND-AGENT:
- JWT utilities (create/verify tokens, HTTP-only cookie helpers)
- Auth dependencies (get_current_user, require_role)
- Auth router (register, login, refresh, logout, me)
- Rate limiting with slowapi
- Pydantic schemas for auth
- Files: `backend/app/auth/*.py`, `backend/app/routers/auth.py`, `backend/app/schemas/auth.py`

FRONTEND-AGENT (after backend):
- LoginModal component (User ID + Password form)
- RegisterPage (with dealer fields toggle)
- AuthContext (login/logout/refresh, store user state)
- ProtectedRoute wrapper
- API service for auth endpoints
- Files: `frontend/src/components/LoginModal.tsx`, `frontend/src/pages/RegisterPage.tsx`, `frontend/src/context/AuthContext.tsx`

**Phase 2B: Product Catalog**

BACKEND-AGENT:
- Product router with role-based serialization (CRITICAL: never return both prices)
- Product schemas (CustomerProductResponse, DealerProductResponse)
- Meilisearch integration service (index products, search)
- Category and Brand routers
- Pagination utility
- Files: `backend/app/routers/products.py`, `backend/app/schemas/product.py`, `backend/app/services/search.py`

FRONTEND-AGENT (after backend):
- ProductCard component (customer variant + dealer variant)
- ProductGrid with responsive layout
- CategoryTabs filter component
- SearchBar with Meilisearch integration
- ProductDetailPage
- DealerBanner component (company name, ID, tier)
- LowStockBadge component
- Files: `frontend/src/components/ProductCard.tsx`, `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/ProductDetailPage.tsx`

**Phase 2C: AI Product Upload**

BACKEND-AGENT:
- AI Vision service (OpenAI GPT-4 Vision integration)
- Web scraper service (product spec lookup)
- Product draft router (upload, get draft, update, publish)
- Celery tasks for async AI processing
- S3 upload utility
- Files: `backend/app/services/ai_vision.py`, `backend/app/services/web_scraper.py`, `backend/app/routers/products.py` (draft endpoints), `backend/app/tasks/product_tasks.py`

FRONTEND-AGENT (after backend):
- AIProductUploadPage (multi-step wizard)
- ImageDropzone component
- AIProcessingSpinner
- ProductDraftForm (review mode + edit mode toggle)
- MarginCalculator component
- SpecsEditor component
- CategoryDropdown
- Files: `frontend/src/pages/AIProductUploadPage.tsx`, `frontend/src/components/MarginCalculator.tsx`, `frontend/src/components/ImageDropzone.tsx`

**Phase 2D: Orders & Cart**

BACKEND-AGENT:
- Cart router (CRUD cart items, price validation)
- Order router (create from cart, list, detail)
- Razorpay payment service (create order, verify webhook)
- Order number generation utility
- Email notification on order confirmation
- Files: `backend/app/routers/cart.py`, `backend/app/routers/orders.py`, `backend/app/services/payment.py`, `backend/app/services/email.py`

FRONTEND-AGENT (after backend):
- CartPage with item list and summary
- CheckoutPage with address form
- Razorpay checkout integration
- OrdersPage (history list)
- OrderDetailPage with status tracker
- Files: `frontend/src/pages/CartPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`, `frontend/src/pages/OrdersPage.tsx`

**Phase 2E: GST Invoicing**

BACKEND-AGENT:
- Invoice generation service (GST calculation, PDF generation)
- Invoice router (generate, list, detail, PDF download)
- Celery task for async PDF generation
- Sequential invoice numbering utility
- Files: `backend/app/routers/invoices.py`, `backend/app/services/invoice_generator.py`, `backend/app/schemas/invoice.py`

FRONTEND-AGENT (after backend):
- InvoicesPage (list)
- InvoiceDetailPage (print/download)
- TaxBreakdown component
- Files: `frontend/src/pages/InvoicesPage.tsx`, `frontend/src/pages/InvoiceDetailPage.tsx`

**Phase 2F: Admin Panel + Dashboard**

BACKEND-AGENT:
- Admin router (users, dealers, stats, orders, products)
- Dashboard stats endpoint (role-based)
- Admin-only middleware
- Files: `backend/app/routers/admin.py`, `backend/app/routers/dashboard.py`

FRONTEND-AGENT (after backend):
- AdminDashboard, AdminUsersPage, AdminDealersPage, AdminOrdersPage, AdminProductsPage
- DashboardPage (customer vs dealer variant)
- Files: `frontend/src/pages/admin/*.tsx`, `frontend/src/pages/DashboardPage.tsx`

**Validation Gate 2:**
```bash
ruff check backend/
cd frontend && npm run lint
cd frontend && npm run type-check
```

---

### Phase 3: Quality (3 agents in parallel)

**TEST-AGENT:**
- Backend: pytest fixtures, test auth flow, test role-based pricing serialization, test GST calculation, test Razorpay webhook verification, test admin endpoints
- Frontend: React Testing Library tests for ProductCard variants, LoginModal, MarginCalculator, AuthContext
- Integration: test full order flow (cart → checkout → payment → invoice)
- Target: 80%+ coverage
- Files: `backend/tests/**`, `frontend/src/**/*.test.tsx`

**REVIEW-AGENT:**
- Security audit: verify JWT cookie settings (HttpOnly, Secure, SameSite), rate limiting works, no price leakage in API responses
- Pricing audit: verify backend NEVER returns both prices, verify frontend can't access dealer prices without auth
- Payment audit: verify Razorpay webhook signature validation, no payment bypass
- GST audit: verify correct CGST/SGST vs IGST calculation, sequential invoice numbering
- Code quality: no hardcoded secrets, no print(), no console.log, proper error handling

**DEVOPS-AGENT:**
- Verify Docker builds succeed
- Test docker-compose full stack startup
- Verify all services connect (PostgreSQL, Redis, Meilisearch, Celery)
- Health check endpoints
- Files: verify `docker-compose.yml`, add health checks

**Validation Gate 3:**
```bash
pytest backend/tests -v --cov --cov-fail-under=80
cd frontend && npm test
docker-compose build
```

---

### Final Validation
```bash
# Full stack smoke test
docker-compose up -d
curl http://localhost:8000/health
curl http://localhost:8000/docs  # OpenAPI/Swagger
curl http://localhost:3000       # Frontend loads

# Run all checks
ruff check backend/
cd frontend && npm run lint && npm run type-check
pytest backend/tests -v --cov
cd frontend && npm test
```

---

## VALIDATION GATES

| Gate | Phase | Commands |
|------|-------|----------|
| 1 | Foundation | `pip install -r requirements.txt`, `alembic upgrade head`, `npm install`, `docker-compose config` |
| 2 | Modules | `ruff check backend/`, `npm run lint`, `npm run type-check` |
| 3 | Quality | `pytest --cov --cov-fail-under=80`, `npm test`, `docker-compose build` |
| Final | Integration | `docker-compose up -d`, `curl localhost:8000/health`, full stack verification |

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://micromachines:password@localhost:5432/micromachines

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI (AI Product Upload)
OPENAI_API_KEY=sk-...

# Razorpay (Payments)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Meilisearch (Product Search)
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=...

# Redis (Celery Broker)
REDIS_URL=redis://localhost:6379/0

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=micromachines-uploads
AWS_REGION=ap-south-1

# Email (Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
FROM_EMAIL=noreply@micromachines.in

# GST (India-specific)
SELLER_STATE=Maharashtra
SELLER_GSTIN=...
DEFAULT_GST_RATE=18

# Frontend
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## FILE MANIFEST

### Backend (37 files estimated)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, middleware, CORS
│   ├── config.py                  # Pydantic Settings
│   ├── database.py                # SQLAlchemy engine, session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User, DealerProfile, RefreshToken
│   │   ├── product.py             # Product, ProductDraft, Category, Brand
│   │   ├── cart.py                # Cart, CartItem
│   │   ├── order.py               # Order, OrderItem
│   │   └── invoice.py             # Invoice, InvoiceItem
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                # Login, Register, Token, UserResponse
│   │   ├── product.py             # CustomerProduct, DealerProduct, ProductCreate
│   │   ├── cart.py                # CartItem, CartResponse
│   │   ├── order.py               # OrderCreate, OrderResponse
│   │   └── invoice.py             # InvoiceResponse, InvoiceItemResponse
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # /api/v1/auth/*
│   │   ├── products.py            # /api/v1/products/* + /drafts/*
│   │   ├── cart.py                # /api/v1/cart/*
│   │   ├── orders.py              # /api/v1/orders/*
│   │   ├── invoices.py            # /api/v1/invoices/*
│   │   ├── admin.py               # /api/v1/admin/*
│   │   └── dashboard.py           # /api/v1/dashboard/*
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_vision.py           # OpenAI GPT-4 Vision integration
│   │   ├── web_scraper.py         # Product spec web search
│   │   ├── search.py              # Meilisearch integration
│   │   ├── payment.py             # Razorpay integration
│   │   ├── invoice_generator.py   # GST calc + PDF generation
│   │   └── email.py               # SMTP email service
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── jwt.py                 # Token create/verify, cookie helpers
│   │   └── dependencies.py        # get_current_user, require_role
│   └── tasks/
│       ├── __init__.py
│       ├── celery_app.py           # Celery configuration
│       └── product_tasks.py        # AI processing, PDF generation tasks
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_products.py
│   ├── test_cart.py
│   ├── test_orders.py
│   ├── test_invoices.py
│   └── test_admin.py
└── requirements.txt
```

### Frontend (30 files estimated)
```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Logo, search, login/dealer banner, nav
│   │   │   ├── Footer.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── ProductCard.tsx         # Dual variant (customer/dealer)
│   │   ├── ProductGrid.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── SearchBar.tsx
│   │   ├── LoginModal.tsx
│   │   ├── DealerBanner.tsx
│   │   ├── MarginCalculator.tsx
│   │   ├── ImageDropzone.tsx
│   │   ├── LowStockBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TaxBreakdown.tsx
│   ├── pages/
│   │   ├── HomePage.tsx            # Product catalog
│   │   ├── ProductDetailPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AIProductUploadPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── InvoicesPage.tsx
│   │   ├── InvoiceDetailPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminUsersPage.tsx
│   │       ├── AdminDealersPage.tsx
│   │       ├── AdminOrdersPage.tsx
│   │       └── AdminProductsPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useCart.ts
│   │   └── useOrders.ts
│   ├── services/
│   │   ├── api.ts                  # Axios instance with cookie config
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── cartService.ts
│   │   ├── orderService.ts
│   │   └── invoiceService.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── types/
│       ├── auth.ts
│       ├── product.ts
│       ├── cart.ts
│       ├── order.ts
│       └── invoice.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

### Infrastructure (5 files)
```
├── docker-compose.yml
├── backend/Dockerfile
├── frontend/Dockerfile
├── .env.example
└── .gitignore
```

---

## CRITICAL IMPLEMENTATION RULES

1. **Pricing Isolation (HIGHEST PRIORITY):** The API must NEVER return both `customer_price` and `dealer_price` in the same response. Use separate Pydantic response models (`CustomerProductResponse` vs `DealerProductResponse`) selected by a dependency that checks user role.

2. **No Dealer Leakage:** When user is not authenticated or is a customer, the frontend must show zero B2B/dealer/wholesale terminology. No "DEALER PRICE" badge, no savings, no "+ Add Product" nav item, no dealer banner.

3. **JWT Cookie Security:** Access tokens in HTTP-only, Secure (in production), SameSite=Lax cookies. Never in response body, never in localStorage. Include CSRF token via custom header for state-changing requests.

4. **Backend-Enforced Everything:** All authorization (role checks, ownership checks), all pricing logic, all payment verification happens on the backend. The frontend is a display layer only.

5. **GST Correctness:** Invoice numbering must be sequential with no gaps. Tax calculation must correctly differentiate intra-state (CGST+SGST) vs inter-state (IGST). HSN codes are mandatory per product.

---

## NEXT STEP

Execute with parallel agents:
```bash
/execute-prp PRPs/micromachines-prp.md
```
