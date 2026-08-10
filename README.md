# Mini ERP + CRM Operations Portal

A fully functional, production-ready **Mini ERP + CRM Operations Portal** for wholesale and distribution businesses. Built with Node.js/TypeScript backend, React TypeScript frontend, and PostgreSQL database with strict transactional stock management.

---

## ✅ E2E Verification Results (Auto-Tested)

All business logic flows were verified automatically after build:

| Test | Result |
|---|---|
| Admin, Sales, Warehouse, Accounts login | ✅ PASS |
| Customer creation + follow-up note | ✅ PASS |
| Product creation with initial stock | ✅ PASS |
| Sales Challan confirm → Stock 10→6 (Requested 4) | ✅ PASS |
| Insufficient stock rejection (Stock 6, Requested 12) → HTTP 400 | ✅ PASS |
| RBAC: Accounts role blocked from product creation → HTTP 403 | ✅ PASS |

---

## 🏗 Architecture

```
Full stack/
├── backend/                    # Node.js + TypeScript + Express.js
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL primary schema
│   │   ├── schema.sqlite.prisma # SQLite schema (local dev only)
│   │   └── seed.ts              # Database seeder (4 role accounts + sample data)
│   ├── src/
│   │   ├── config/             # ENV config, DB client (Prisma)
│   │   ├── middleware/         # JWT Auth, RBAC, Error handler
│   │   ├── controllers/        # Auth, Customer, Product, Stock, Challan, Dashboard
│   │   ├── routes/             # Express route definitions
│   │   ├── types/              # TypeScript type definitions (Role, Status enums)
│   │   └── utils/              # Challan number generator
│   └── package.json
├── frontend/                   # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                # Axios client with JWT interceptors
│   │   ├── components/         # Navbar, Sidebar, StatusBadge, MetricCard, Modal
│   │   ├── context/            # AuthContext (user, role, token management)
│   │   ├── pages/              # Login, Dashboard, Customers, Products, Inventory, Challans
│   │   └── types/              # Frontend TypeScript interfaces
│   └── package.json
├── postman_collection.json     # Complete API test collection
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ / npm 9+
- PostgreSQL 14+ **OR** no prerequisites for SQLite local dev

---

### Option A: Local SQLite (Zero Config - Instant Start)

**1. Setup Backend:**
```powershell
cd backend
npm install
npm run db:setup:sqlite   # Creates SQLite dev.db and seeds all test data
npm run dev               # Starts backend on port 5000
```

**2. Setup Frontend (new terminal):**
```powershell
cd frontend
npm install
npm run dev               # Starts React dev server on port 3000
```

**3. Open browser:** [http://localhost:3000](http://localhost:3000)

---

### Option B: PostgreSQL (Production Standard)

**1. Create PostgreSQL database:**
```sql
CREATE DATABASE mini_erp;
```

**2. Configure backend `.env`:**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=1d
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/mini_erp?schema=public"
```

**3. Switch to PostgreSQL schema:**
```powershell
cd backend
# Rename prisma/schema.prisma to schema.sqlite.prisma (backup)
# Rename prisma/schema.prisma to use postgresql (update provider)
npm run prisma:push     # Push schema to PostgreSQL
npm run seed            # Seed test accounts and sample data
npm run dev             # Start backend
```

**4. Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

---

## 🔐 Test Login Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@erp.com` | `Admin@123` | Full access — all modules |
| **Sales** | `sales@erp.com` | `Sales@123` | CRM, Sales Challans (create/confirm), View products |
| **Warehouse** | `warehouse@erp.com` | `Warehouse@123` | Products (add/edit), Stock IN/OUT adjustments |
| **Accounts** | `accounts@erp.com` | `Accounts@123` | Read-only: Customers, Products, Challans, Stock logs |

> Use the **Quick Test Account** buttons on the Login page to instantly fill credentials.

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/login        # Login with email & password → Returns JWT
GET    /api/auth/me           # Get logged-in user profile
```

### Customer CRM
```
GET    /api/customers         # List customers (search, filter by type/status, pagination)
POST   /api/customers         # Create customer [ADMIN, SALES]
GET    /api/customers/:id     # Customer detail with notes & challan history
PUT    /api/customers/:id     # Update customer [ADMIN, SALES]
POST   /api/customers/:id/notes  # Add follow-up note [ADMIN, SALES]
```

### Products
```
GET    /api/products          # List products (search, category filter, low-stock filter)
POST   /api/products          # Create product [ADMIN, WAREHOUSE, SALES]
GET    /api/products/:id      # Product detail + recent stock movements
PUT    /api/products/:id      # Update product [ADMIN, WAREHOUSE, SALES]
GET    /api/products/categories  # All distinct categories
```

### Inventory / Stock Movements
```
GET    /api/stock-movements   # Full audit log (search, filter by type, pagination)
POST   /api/stock-movements   # Record manual IN/OUT adjustment [ADMIN, WAREHOUSE]
```

### Sales Challans (Transactional Stock Control)
```
GET    /api/sales-challans           # List challans (search, filter by status)
POST   /api/sales-challans           # Create challan (DRAFT or direct CONFIRMED) [ADMIN, SALES]
GET    /api/sales-challans/:id       # Challan detail with snapshot items
PATCH  /api/sales-challans/:id/status  # Confirm or Cancel challan [ADMIN, SALES]
```

### Dashboard
```
GET    /api/dashboard/stats   # KPI summary, low-stock alerts, recent challans
```

---

## ⚙️ Business Logic: Sales Challan → Stock

### Rules
1. **Creating DRAFT**: No stock change. Items stored as snapshots.
2. **Creating CONFIRMED or Confirming DRAFT → CONFIRMED**:
   - Fetch current stock for ALL items inside a **single database transaction**
   - If ANY product has `currentStock < requestedQuantity` → Abort entire transaction → HTTP 400 with exact error message
   - If ALL products have sufficient stock → Deduct stock atomically → Log `OUT` stock movement for each product
3. **Cancelling CONFIRMED**: Restores stock for all items + logs `IN` stock movement
4. **Cancelled challan**: Cannot change status further

### Example
```
Product A: currentStock = 10
Challan requests: quantity = 4

→ CONFIRMED: Stock becomes 6 ✅
→ Stock movement logged: OUT | 4 units | "Sales Challan Confirmation SCH-XXXXXX-XXXX"

Product A: currentStock = 6
Challan requests: quantity = 12

→ REJECTED: HTTP 400 "Insufficient stock. Available: 6, Requested: 12." ❌
→ Stock remains: 6 (transaction rolled back)
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts with role (ADMIN, SALES, WAREHOUSE, ACCOUNTS) |
| `customers` | CRM customer records |
| `customer_notes` | Follow-up note timeline per customer |
| `products` | SKU master with stock levels |
| `stock_movements` | Full IN/OUT audit log |
| `sales_challans` | Dispatch challans with status |
| `sales_challan_items` | Line items with **product snapshot** (name, SKU, price at time of creation) |

---

## 🎨 UI Modules

| Page | Path | Features |
|---|---|---|
| Login | `/login` | JWT auth, quick role selector buttons |
| Dashboard | `/` | KPI cards, low-stock alerts table, recent challans |
| Customer CRM | `/customers` | Search, type/status filter, add/edit modal, pagination |
| Customer Detail | `/customers/:id` | Contact info, follow-up notes timeline, challan history |
| Products | `/products` | Catalog list, low-stock badge, category filter, add/edit modal |
| Inventory | `/inventory` | Full stock movement log, manual IN/OUT adjustment modal |
| Sales Challans | `/sales-challans` | List with status filter, view detail modal, confirm/cancel actions |
| Create Challan | `/sales-challans/new` | Multi-product picker, real-time stock warning, draft or direct confirm |

---

## 🌍 Deployment Instructions

### Frontend → Vercel / Netlify
```bash
cd frontend
npm run build         # Outputs to dist/
# Upload dist/ to Vercel or Netlify
# Set environment variable: VITE_API_URL=https://your-backend-url.com
```
> Also update `vite.config.ts` proxy target to your production backend URL.

### Backend → Render / Railway / Fly.io
1. Push code to GitHub
2. Connect repo to Render/Railway
3. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_production_secret
   PORT=5000
   NODE_ENV=production
   ```
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`

### Database → Neon / Supabase / Render PostgreSQL
1. Create PostgreSQL database on Neon (free) or Supabase
2. Copy the `DATABASE_URL` connection string
3. Paste into backend environment variables
4. Run `npm run prisma:push` and `npm run seed` once

---

## ✅ Requirements Completed (from Case Study PDF)

### Mandatory Modules
- [x] **Authentication + RBAC**: JWT login, 4 roles (Admin/Sales/Warehouse/Accounts), route protection
- [x] **Customer CRM**: Add, Edit, Search, Filter, Detail page with follow-up notes timeline, all fields (name, mobile, email, business, GST, type, address, status, follow-up date)
- [x] **Products & Inventory**: Add/Edit products, SKU, category, unit price, current stock, minimum stock alert, warehouse location, stock movement log (IN/OUT, quantity, reason, created by, timestamp)
- [x] **Sales Challan**: Customer select, multi-product picker, auto-generated challan number (SCH-YYYYMM-XXXX), DRAFT/CONFIRMED/CANCELLED status, stock deduction on confirm, negative stock prevention with HTTP 400 error, **product snapshot storage** (name, SKU, price at time of creation)

### API Requirements
- [x] Input validation (Zod schemas on all endpoints)
- [x] Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [x] Meaningful error messages with field-level details
- [x] Pagination on all list endpoints
- [x] Search + filter on customers, products, challans, stock movements

### UI Requirements
- [x] Login page with quick role selector
- [x] Dashboard with KPI metrics + low stock alerts
- [x] Sidebar navigation with role-based link filtering
- [x] Customer management (list, search, add, edit, detail, notes)
- [x] Product management (list, search, filter, add, edit)
- [x] Inventory stock movements log + manual adjustment
- [x] Sales challans (list, create, view detail with snapshot items, confirm, cancel)
- [x] Forms with validation
- [x] Tables with search/filter and pagination
- [x] Responsive Tailwind CSS layout
- [x] Loading states and error handling

### Business Logic
- [x] Transactional stock management with PostgreSQL transaction
- [x] All-or-nothing stock check (if one product fails, entire confirmation fails)
- [x] Stock restored on challan cancellation
- [x] Product snapshot data stored in `sales_challan_items`

---

## ⚠️ Known Limitations

1. **SQLite case-insensitive search**: The SQLite local dev database does not support `mode: 'insensitive'` in Prisma queries. Search functions work but are case-sensitive in SQLite. This is fully resolved with PostgreSQL in production.
2. **No file upload**: Product images not implemented (not required by case study).
3. **PDF/invoice export**: Not implemented (explicitly noted as bonus feature).
4. **Docker**: Not included (explicitly noted as bonus feature).
5. **User management UI**: Admin can create users via seeder but no UI for user management (not required by case study).
6. **No email notifications**: Follow-up date alerts are visual only (no automated emails).
