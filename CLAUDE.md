# CLAUDE.md - MicroMachines Project Rules

> Project-specific rules for Claude Code. This file is read automatically.

---

## Project Overview

**Project Name:** MicroMachines
**Description:** Dual-pricing e-commerce platform for computer peripherals distributors
**Tech Stack:**
- Backend: FastAPI + Python 3.11+
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL + SQLAlchemy
- Auth: Email/Password + JWT (HTTP-only cookies)
- UI: Tailwind CSS + shadcn/ui
- Payments: Razorpay
- Search: Meilisearch
- AI: OpenAI GPT-4 Vision
- Async: Celery + Redis
- Storage: AWS S3 / Cloudinary

---

## Project Structure

```
micromachines/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── dealer.py
│   │   │   ├── product.py
│   │   │   ├── cart.py
│   │   │   ├── order.py
│   │   │   └── invoice.py
│   │   ├── schemas/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── cart.py
│   │   │   ├── orders.py
│   │   │   ├── invoices.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   ├── ai_vision.py
│   │   │   ├── web_scraper.py
│   │   │   ├── payment.py
│   │   │   ├── invoice_generator.py
│   │   │   └── email.py
│   │   ├── auth/
│   │   │   ├── jwt.py
│   │   │   └── dependencies.py
│   │   └── tasks/
│   │       ├── celery_app.py
│   │       └── product_tasks.py
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── DealerBanner.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   ├── MarginCalculator.tsx
│   │   │   └── CategoryTabs.tsx
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── types/
│   └── package.json
├── .claude/
│   └── commands/
├── skills/
├── agents/
└── PRPs/
```

---

## Code Standards

### Python (Backend)
```python
# ALWAYS use type hints
def get_product(db: Session, product_id: int) -> Product:
    pass

# ALWAYS use async endpoints
@router.get("/products/{slug}")
async def get_product(slug: str, db: Session = Depends(get_db)):
    pass

# Role-based pricing serialization
def serialize_product(product: Product, user_role: str) -> dict:
    """Return only the relevant price based on user role."""
    pass
```

### TypeScript (Frontend)
```typescript
// ALWAYS define interfaces for props and data
interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  price: number;
  mrp?: number; // Only present for dealers
  savingsPercent?: number;
  imageUrl: string;
}

// NO any types allowed
const fetchProducts = async (category?: string): Promise<Product[]> => {
  // ...
};
```

---

## Forbidden Patterns

### Backend
- `print()` → use `logging` module
- Plain text passwords → use bcrypt
- Hardcoded secrets → use environment variables
- `SELECT *` → specify columns
- Skip input validation → always validate
- Return both prices in API → role-based serialization only
- Store JWT in response body → HTTP-only cookies only
- Trust frontend pricing → backend-enforced always

### Frontend
- `any` type → define proper interfaces
- `console.log` in production → use proper error handling
- Inline styles → use Tailwind CSS classes
- Show dealer terminology to customers → role-check all UI elements
- Store JWT in localStorage → HTTP-only cookies only
- Display both prices → show only role-appropriate price

---

## Module-Specific Rules

### Authentication
- JWT stored in HTTP-only cookies, never localStorage
- Rate limit login to 5 attempts per minute
- Dealer accounts require admin approval before activation
- Role enum: customer, dealer, admin

### Product Catalog (CRITICAL)
- API MUST return only relevant price based on authenticated user role
- Anonymous/Customer: `price` = customer_price (MRP), no dealer price fields
- Dealer: `price` = dealer_price, `mrp` = customer_price, `savings_percent`, `savings_amount`
- Frontend must never receive both prices simultaneously
- No mention of "dealer", "wholesale", or B2B terminology for unauthenticated users

### AI Product Upload
- Dealer-only feature, enforce on both backend and frontend
- Async processing via Celery for AI and web scraping tasks
- Always validate AI-generated data before presenting to user
- Dealer must manually set both customer_price and dealer_price

### GST Invoicing
- Same state → CGST (9%) + SGST (9%)
- Different states → IGST (18%)
- HSN codes required per product
- Sequential invoice numbering, never skip or duplicate

---

## API Conventions

- All endpoints prefixed with `/api/v1/`
- Use plural nouns: `/products`, `/orders`, `/invoices`
- HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden (wrong role)
  - 404: Not Found
  - 409: Conflict
  - 429: Rate Limited

---

## Authentication

### JWT Configuration
- Access token expires: 30 minutes
- Refresh token expires: 7 days
- Algorithm: HS256
- Storage: HTTP-only cookies
- CSRF protection via SameSite + custom header

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/micromachines

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=sk-...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=...

# Redis
REDIS_URL=redis://localhost:6379/0

# File Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=micromachines-uploads
AWS_REGION=ap-south-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Frontend
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

---

## Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Services
docker-compose up -d postgres redis meilisearch

# Celery Worker
celery -A app.tasks.celery_app worker --loglevel=info

# Tests
pytest backend/tests -v
cd frontend && npm test

# Linting
ruff check backend/
cd frontend && npm run lint
```

---

## Commit Message Format

```
feat(products): add dual-pricing serialization
fix(auth): fix JWT cookie SameSite attribute
refactor(orders): extract payment service
test(invoices): add GST calculation tests
docs: update API documentation
```

---

## Skills Reference

| Task | Skill |
|------|-------|
| Database models | skills/DATABASE.md |
| API + Auth | skills/BACKEND.md |
| React + UI | skills/FRONTEND.md |
| Testing | skills/TESTING.md |
| Deployment | skills/DEPLOYMENT.md |

---

## Agent Coordination

| Agent | Role |
|-------|------|
| DATABASE-AGENT | Models + migrations |
| BACKEND-AGENT | API + auth + services |
| FRONTEND-AGENT | UI + pages + components |
| DEVOPS-AGENT | Docker + CI/CD |
| TEST-AGENT | Unit + integration tests |
| REVIEW-AGENT | Security + code quality |

Read agent definitions in `/agents/` folder.

---

## Validation

```bash
ruff check backend/ && pytest
npm run lint && npm run type-check
docker-compose build
```

---

## Workflow

```
1. Edit INITIAL.md (define product)
2. /generate-prp INITIAL.md
3. /execute-prp PRPs/micromachines-prp.md
```
