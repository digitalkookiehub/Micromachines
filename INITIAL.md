# INITIAL.md - MicroMachines Product Definition

> E-commerce platform for computer peripherals distributors with dual-pricing architecture, AI-powered product upload, and GST-compliant invoicing.

---

## PRODUCT

### Name
MicroMachines

### Description
A dual-pricing e-commerce platform that serves two user segments from a single storefront. Unauthenticated visitors see a clean consumer storefront with MRP pricing. Authenticated dealers get wholesale pricing, savings indicators, and access to AI-powered product upload that reduces listing time from 10+ minutes to under 60 seconds. Built for Indian computer peripherals distributors who sell to both retail customers and dealer networks.

### Target User
Computer peripherals, hardware, software, and printer shop owners (dealers) who need a unified platform to manage both retail and wholesale sales channels.

### Type
- [x] SaaS (Software as a Service)
- [x] B2B + B2C Hybrid

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Backend | FastAPI + Python 3.11+ |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL + SQLAlchemy |
| Auth | Email/Password + JWT (HTTP-only cookies) |
| UI | Tailwind CSS + shadcn/ui |
| Payments | Razorpay |
| Search | Meilisearch |
| AI | OpenAI GPT-4 Vision |
| Async Tasks | Celery + Redis |
| File Storage | AWS S3 / Cloudinary |

---

## MODULES

### Module 1: Authentication (Required)

**Description:** User authentication with role-based access control. Two roles: Customer (default/anonymous) and Dealer (authenticated). Admin role for platform management.

**Models:**
```
User:
  - id, email, hashed_password, full_name, phone
  - role: enum (customer/dealer/admin)
  - is_active, is_verified
  - created_at, updated_at

DealerProfile:
  - id, user_id (FK)
  - company_name, dealer_id (display ID), gst_number
  - tier: enum (silver/gold/platinum) — future
  - credit_limit, approved_by, approved_at, is_approved

RefreshToken:
  - id, user_id (FK), token, expires_at, revoked, created_at
```

**Endpoints:**
```
POST /api/v1/auth/register       - Create new account
POST /api/v1/auth/login          - Login (returns JWT in HTTP-only cookie)
POST /api/v1/auth/refresh        - Refresh access token
POST /api/v1/auth/logout         - Revoke token / clear cookie
GET  /api/v1/auth/me             - Get current user profile + role
PUT  /api/v1/auth/me             - Update profile
```

**Pages:**
- Login modal (User ID + Password, triggered from header Login button)
- /register - Registration page
- /forgot-password - Forgot password page
- /profile - User profile page (protected)

**Security:**
- JWT in HTTP-only cookies (not localStorage)
- Rate-limited login (5 attempts/minute)
- Backend-enforced role checks
- Admin-only dealer approval

---

### Module 2: Product Catalog

**Description:** Product browsing with dual-pricing architecture. API returns only the relevant price based on user role — never both. Customer view: MRP + "Inclusive of all taxes". Dealer view: dealer price + MRP strikethrough + savings % + "DEALER PRICE" badge.

**Models:**
```
Product:
  - id, name, slug, brand, sku, hsn_code
  - category: enum (mouse/keyboard/monitor/headset/storage/accessories)
  - description, specifications (JSONB)
  - customer_price (MRP), dealer_price
  - stock_quantity, image_url, thumbnail_url
  - is_active, created_by (FK), created_at, updated_at

Category:
  - id, name, slug, display_order, is_active

Brand:
  - id, name, logo_url, is_active
```

**Endpoints:**
```
GET    /api/v1/products              - List products (role-based pricing)
GET    /api/v1/products/{slug}       - Product detail (role-based pricing)
GET    /api/v1/products/search?q=    - Search by name/brand (Meilisearch)
GET    /api/v1/products/categories   - List categories
GET    /api/v1/products/brands       - List brands
POST   /api/v1/products              - Create product (dealer only)
PUT    /api/v1/products/{id}         - Update product (owner/admin)
DELETE /api/v1/products/{id}         - Soft delete (owner/admin)
```

**Pages:**
- / (Home) - Product catalog grid with category tabs (All, Mouse, Keyboard, Monitor, Headset, Storage, Accessories)
- /products/{slug} - Product detail page
- Product cards: image, brand badge, category, name, truncated description, top 3 spec chips, role-based price, CTA button
- Low stock indicator when stock < 20
- Search bar (name/brand)

**CRITICAL — Pricing Logic:**
- Anonymous/Customer → API returns `price` = customer_price, label "Inclusive of all taxes"
- Dealer → API returns `price` = dealer_price, `mrp` = customer_price, `savings_percent`, `savings_amount`
- Backend serializer selects fields based on request.user.role
- Frontend NEVER receives both prices simultaneously

---

### Module 3: AI Product Upload (Dealer Only)

**Description:** AI-powered product listing. Photo upload → OpenAI GPT-4 Vision detection → web search for specs → auto-fill → dealer review/edit → pricing with margin calculator → publish.

**Models:**
```
ProductDraft:
  - id, dealer_id (FK), image_url
  - ai_detected_data (JSONB), web_scraped_data (JSONB), final_data (JSONB)
  - status: enum (processing/review/published/failed)
  - created_at, updated_at
```

**Endpoints:**
```
POST /api/v1/products/upload-image      - Upload image + trigger AI (dealer only)
GET  /api/v1/products/draft/{id}        - Get AI-generated draft
PUT  /api/v1/products/draft/{id}        - Update draft with edits
POST /api/v1/products/draft/{id}/publish - Publish draft to catalog
```

**Pages:**
- /products/add - AI Product Upload (dealer only, via "+ Add Product" nav)
  - Step 1: Image upload (drag-and-drop)
  - Step 2: AI processing indicator → auto-filled form
  - Step 3: Review mode → "Edit" toggles all fields editable → "Done Editing" saves
  - Step 4: Pricing — customer price, dealer price, live margin calculator (margin %, amount)
  - Step 5: "Save" publishes to catalog

**AI Pipeline:**
1. Image → S3/Cloudinary
2. Image → OpenAI GPT-4 Vision (detect product type, brand, model, category, features)
3. Celery task: web search for description + specifications
4. Merge AI + web data into draft
5. Return draft to dealer for review

---

### Module 4: Orders & Cart

**Description:** Shopping cart and checkout. Customers "Add to Cart", dealers "Add to Order". Razorpay payment integration.

**Models:**
```
Cart:
  - id, user_id (FK, nullable), session_id (guests), created_at, updated_at

CartItem:
  - id, cart_id (FK), product_id (FK), quantity, price_at_add, created_at

Order:
  - id, order_number (auto), user_id (FK)
  - status: enum (pending/confirmed/processing/shipped/delivered/cancelled)
  - subtotal, tax_amount, total
  - shipping_address (JSONB), billing_address (JSONB)
  - payment_id, payment_status, notes
  - created_at, updated_at

OrderItem:
  - id, order_id (FK), product_id (FK)
  - product_name (snapshot), quantity, unit_price, total_price, hsn_code
```

**Endpoints:**
```
GET    /api/v1/cart               - Get current cart
POST   /api/v1/cart/items         - Add item
PUT    /api/v1/cart/items/{id}    - Update quantity
DELETE /api/v1/cart/items/{id}    - Remove item
POST   /api/v1/orders             - Create order from cart
GET    /api/v1/orders             - List user's orders
GET    /api/v1/orders/{id}        - Order detail
POST   /api/v1/orders/{id}/pay    - Initiate Razorpay payment
POST   /api/v1/orders/webhook     - Razorpay webhook handler
```

**Pages:**
- /cart - Cart page (items, quantities, role-based pricing, subtotal)
- /checkout - Checkout (address form, order summary, Razorpay payment)
- /orders - Order history
- /orders/{id} - Order detail with status tracking

---

### Module 5: GST Invoicing

**Description:** GST-compliant invoice generation with HSN codes and CGST/SGST/IGST tax split.

**Models:**
```
Invoice:
  - id, invoice_number (auto, sequential), order_id (FK), user_id (FK)
  - billing_name, billing_address (JSONB), gstin
  - subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, total_amount
  - place_of_supply, is_igst (inter-state)
  - pdf_url, created_at

InvoiceItem:
  - id, invoice_id (FK), product_name, hsn_code
  - quantity, unit_price, taxable_amount
  - cgst_rate, cgst_amount, sgst_rate, sgst_amount
  - igst_rate, igst_amount, total
```

**Endpoints:**
```
POST /api/v1/invoices/generate/{order_id} - Generate invoice
GET  /api/v1/invoices                     - List invoices
GET  /api/v1/invoices/{id}                - Invoice detail
GET  /api/v1/invoices/{id}/pdf            - Download PDF
```

**Pages:**
- /invoices - Invoice list
- /invoices/{id} - Invoice detail (print/download)

**Tax Logic:**
- Same state → CGST (9%) + SGST (9%)
- Different states → IGST (18%)
- HSN codes per product, mapped to tax rates

---

### Module 6: Admin Panel

**Description:** Admin-only management interface.

**Endpoints:**
```
GET  /api/v1/admin/users              - List users
PUT  /api/v1/admin/users/{id}         - Update user status/role
POST /api/v1/admin/dealers/{id}/approve - Approve dealer
POST /api/v1/admin/dealers/{id}/reject  - Reject dealer
GET  /api/v1/admin/stats              - Platform statistics
GET  /api/v1/admin/orders             - All orders
GET  /api/v1/admin/products           - All products
```

**Pages:**
- /admin - Dashboard with key metrics
- /admin/users - User management
- /admin/dealers - Dealer approval queue
- /admin/orders - Order management
- /admin/products - Product moderation

---

### Module 7: Dashboard

**Description:** Role-based dashboard overview.

**Pages:**
- /dashboard
  - Customer: recent orders, saved addresses, account info
  - Dealer: products listed, orders received, revenue, dealer tier, quick "+ Add Product" link

---

## MVP SCOPE

### Must Have (MVP)
- [x] User registration and login (JWT in HTTP-only cookies)
- [x] Dealer vs Customer role-based access
- [x] Dual-pricing storefront (role-based API responses)
- [x] Product catalog with search and category filters
- [x] AI-powered product upload (OpenAI GPT-4 Vision)
- [x] Shopping cart and order flow
- [x] Razorpay payment integration
- [x] GST-compliant invoicing with HSN codes
- [x] Admin panel with dealer approval workflow
- [x] Email notifications (order confirmation, dealer approval)
- [x] Dealer banner with company name/ID when logged in

### Nice to Have (Post-MVP)
- [ ] Tiered dealer pricing (Silver/Gold/Platinum) with volume-based auto-upgrades
- [ ] Bulk order with MOQ and quantity-based discount slider
- [ ] Credit limits with NET 30/60/90 payment terms
- [ ] RFQ (Request for Quote) system
- [ ] Side-by-side product comparison
- [ ] Compatibility checker
- [ ] Multi-warehouse inventory
- [ ] Dealer sub-accounts with role-based permissions
- [ ] Abandoned cart recovery via email/WhatsApp
- [ ] AI-powered product recommendations
- [ ] Advanced analytics dashboard
- [ ] Return/RMA portal

---

## ACCEPTANCE CRITERIA

### Authentication
- [ ] User can register with email/password
- [ ] User can login via modal (User ID + Password)
- [ ] JWT stored in HTTP-only cookies
- [ ] Login rate-limited to 5 attempts/minute
- [ ] Role returned with auth response
- [ ] Protected routes redirect to login
- [ ] Dealer registration requires admin approval

### Product Catalog
- [ ] Responsive grid layout with product cards
- [ ] Cards show: image, brand badge, category, name, description, spec chips, role-based price, CTA
- [ ] Anonymous → MRP + "Inclusive of all taxes"
- [ ] Dealer → dealer price + MRP strikethrough + savings % + "DEALER PRICE" badge
- [ ] API returns only relevant price — NEVER both
- [ ] Search by name/brand works
- [ ] Category filter tabs work
- [ ] Low stock indicator at < 20 units

### AI Product Upload
- [ ] Dealer can upload product photo
- [ ] GPT-4 Vision identifies product type, brand, model, category
- [ ] Web search populates description and specs
- [ ] Fields auto-fill after AI processing
- [ ] Edit toggle works correctly
- [ ] Margin calculator shows live margin % and amount
- [ ] Published product appears in catalog

### Orders & Cart
- [ ] Add to cart/order works
- [ ] Cart shows role-based pricing
- [ ] Checkout with Razorpay works
- [ ] Order confirmation email sent
- [ ] Order history accessible

### GST Invoicing
- [ ] Invoice auto-generated after payment
- [ ] Correct CGST/SGST vs IGST split
- [ ] HSN codes per line item
- [ ] PDF downloadable
- [ ] Sequential numbering

### Admin Panel
- [ ] View all users
- [ ] Approve/reject dealers
- [ ] View platform statistics
- [ ] Moderate products

### Quality
- [ ] All API endpoints in OpenAPI/Swagger
- [ ] Backend test coverage 80%+
- [ ] TypeScript strict mode passes
- [ ] Docker builds successfully
- [ ] No hardcoded secrets

---

## SPECIAL REQUIREMENTS

### Security
- [x] JWT in HTTP-only cookies (not localStorage)
- [x] Backend-enforced pricing (never trust frontend)
- [x] Rate limiting on auth endpoints
- [x] Input validation on all endpoints
- [x] SQL injection prevention (SQLAlchemy ORM)
- [x] XSS prevention
- [x] HTTPS in production
- [x] Admin-only dealer approval
- [x] CORS configuration

### Integrations
- [x] OpenAI GPT-4 Vision API
- [x] Razorpay payments
- [x] Meilisearch search
- [x] AWS S3 / Cloudinary file storage
- [x] Celery + Redis async tasks
- [x] Email service (SMTP / SendGrid)

### India-Specific
- [x] GST compliance (CGST/SGST/IGST)
- [x] HSN code support
- [x] INR currency
- [x] Indian address format

---

## AGENTS

| Agent | Role | Works On |
|-------|------|----------|
| DATABASE-AGENT | Models + migrations | User, DealerProfile, Product, Cart, Order, Invoice |
| BACKEND-AGENT | API + services | Auth, Products, Cart, Orders, Invoicing, Admin, AI Upload |
| FRONTEND-AGENT | UI + pages | Storefront, Cards, AI Upload, Cart, Checkout, Admin |
| DEVOPS-AGENT | Docker + CI/CD | Docker, Redis, Meilisearch, Celery, S3 |
| TEST-AGENT | Tests | All modules |
| REVIEW-AGENT | Security audit | Pricing logic, auth, payments |

---

# READY?

```bash
/generate-prp INITIAL.md
```

Then:

```bash
/execute-prp PRPs/micromachines-prp.md
```
