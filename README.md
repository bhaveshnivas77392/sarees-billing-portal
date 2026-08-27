# Sri Laxmi Narasimha Silk Sarees — Enterprise Billing & Multi-Branch POS Portal

A comprehensive, open-source, multi-branch Point of Sale (POS) and inventory management platform tailored for silk saree showrooms, textile stores, and retail garment chains.

Built with **Next.js 16 (Turbopack)**, **Supabase PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**, this platform handles high-speed retail barcode billing, dynamic 0% fee UPI QR payments, inter-branch stock transfers, saree exchanges & returns, end-of-day cash drawer reconciliation, and central business intelligence.

---

## 📑 Table of Contents

1. [Architecture & System Design](#-architecture--system-design)
2. [Detailed Feature Breakdown](#-detailed-feature-breakdown)
   - [Point of Sale (POS) Terminal](#1-point-of-sale-pos-terminal--sale)
   - [Inventory & Inward Management](#2-inventory--inward-management--branchid)
   - [Inter-Branch Stock Transfer Engine](#3-inter-branch-stock-transfer-engine--transfer)
   - [Saree Returns & Exchange Desk](#4-saree-returns--exchange-desk--returns)
   - [Shift Close & Cash Drawer Reconciliation](#5-shift-close--cash-drawer-reconciliation--day-close)
   - [Owner Central Analytics & Reports](#6-owner-central-analytics--reports--dashboard)
   - [Thermal Printing & WhatsApp Bill Delivery](#7-thermal-printing--whatsapp-bill-delivery)
3. [User Roles & Access Control](#-user-roles--access-control)
4. [Database Data Model](#-database-data-model)
5. [Local Development Setup](#-local-development-setup)
6. [Environment Variables Reference](#-environment-variables-reference)
7. [Automated Testing Suite](#-automated-testing-suite)
8. [Production Deployment Guide (Vercel + Supabase)](#-production-deployment-guide-vercel--supabase)
9. [Performance & Concurrency Handling](#-performance--concurrency-handling)
10. [License](#-license)

---

## 🏛 Architecture & System Design

```mermaid
graph TD
  User((Cashier / Manager / Owner)) --> NextApp[Next.js 16 Web & PWA]
  NextApp --> EdgeMiddleware[proxy.ts: Auth & Role Route Protection]
  NextApp --> ServerActions[Server Actions: Transactional Mutations]
  ServerActions --> PgBouncer[PgBouncer Connection Pooler: Port 6543]
  PgBouncer --> SupabasePostgres[(Supabase PostgreSQL Database)]
  SupabasePostgres --> RealtimeEngine[Supabase Realtime WebSockets]
  RealtimeEngine --> NextApp
```

- **Server-Side Rendered (RSC)**: All branch inventory and dashboard metrics load fresh data server-side (`export const dynamic = "force-dynamic"`), eliminating stale caching.
- **WebSocket Realtime Synchronization**: When a sale or stock movement occurs at Branch A, Supabase broadcasts postgres change events so Branch B and the Owner Dashboard automatically refresh live without manual page reloads.
- **High Concurrency & Atomic Mutations**: Guarded database queries prevent inventory race conditions; two simultaneous scans of a single remaining saree will never allow stock counts to go negative.

---

## 🌟 Detailed Feature Breakdown

### 1. Point of Sale (POS) Terminal (`/branch/[id]/sale`)
- **Dual-Pane Layout**:
  - **Left Catalog Browser**: Saree cards with instant thumbnail preview, remaining stock badges, and category pills (*All*, *Bridal*, *Festive*, *Pure Silk*, *Georgette*, etc.).
  - **Right Sticky Cart Panel**: Line items with touch-friendly ($\ge 44\text{px}$) `+` / `-` quantity adjustments, discount presets, customer phone history lookup, and final totals.
- **Barcode Scanning Hardware & Camera Mode**:
  - Fully compatible with physical USB and Bluetooth Code128 handheld scanners.
  - Built-in camera scanner modal powered by `html5-qrcode` for mobile phones and tablets.
- **Audio & Haptic Feedback (`feedback.ts`)**:
  - Web Audio API synthesizer generates a positive confirmation chime on successful scan.
  - Generates an error alert buzz if an out-of-stock item or unknown SKU is scanned.
- **Multi-Payment Modes & Dynamic 0% Fee UPI QR**:
  - **CASH**: Standard cash billing with change calculation.
  - **UPI / GPay / PhonePe**: Generates a dynamic NPCI-compliant QR code on-screen with the exact total pre-filled. Customer scans $\rightarrow$ money transfers directly to your bank account with **0% gateway fees**. Includes an optional field for recording bank UTR reference numbers.
  - **CARD**: Standard swipe / POS terminal entry.
  - **SPLIT**: Part cash and part UPI with live recalculation of the remaining QR amount.
- **Customer Purchase History Lookup**:
  - Typing a 10-digit phone number auto-fills the customer's name and displays their visit frequency and lifetime spend summary.

---

### 2. Inventory & Inward Management (`/branch/[id]` & `/add-stock`)
- **Rich Inventory Grid (`BranchInventoryTable.tsx`)**:
  - Saree thumbnail preview with click-to-expand modal.
  - **1-Tap Quick Filters**: Filter instantly by *Total Designs*, *Total Units*, *Low Stock Alert ($\le 3$ units)*, or fabric materials.
  - **Inline Saree Editor Modal**: Edit selling price, cost price, saree name, fabric, and color directly from the table without database access.
- **Stock Inward & Intake (`/add-stock`)**:
  - **New Design Creation**: Generates unique SKU, barcode, and assigns starting branch stock.
  - **Restock by SKU Search**: Fast autocomplete to find and replenish existing designs by typing SKU or barcode strings without scrolling large dropdown menus.

---

### 3. Inter-Branch Stock Transfer Engine (`/branch/[id]/transfer`)
- **Atomic Dispatch Engine**:
  - Select destination branch, saree design, and transfer quantity with dispatch notes.
  - Decrements stock in the source branch and increments stock in the destination branch in a single atomic transaction.
- **Full Audit Trail**:
  - Automatically records `TRANSFER_OUT` on the source branch and `TRANSFER_IN` on the target branch with timestamps and author IDs.
- **Transfer Manifest Log**:
  - View recent inbound and outbound transfers with transfer status.

---

### 4. Saree Returns & Exchange Desk (`/branch/[id]/returns`)
- Look up previous sales by entering the **Invoice Number** (e.g. `Bill #5D8F2A1C`).
- Select the quantity of sarees being returned and input the exchange reason.
- Clicking **"Confirm Return & Restore Stock"**:
  - Automatically increments on-hand stock back into the branch.
  - Logs an audited `RETURN_IN` stock movement record.
  - Generates an exchange credit / refund calculation slip.

---

### 5. Shift Close & Cash Drawer Reconciliation (`/branch/[id]/day-close`)
- Tally daily showroom collections at shop closing time:
  - **Cash Billed Total**: ₹X
  - **UPI / QR Billed Total**: ₹Y
  - **Card Billed Total**: ₹Z
- Cashier counts actual physical cash in the cash drawer and enters the count.
- System flags any cash surplus or shortage discrepancy.
- Submitting locks the day-end audit report for the owner's review.

---

### 6. Owner Central Analytics & Reports (`/dashboard`)
- **Multi-Branch Overview**: Aggregate on-hand stock counts, total inventory valuation (at cost price), period sales revenues, and low-stock alerts across all branches.
- **Date Range Filters**: Filter sales performance by *Today*, *Last 7 Days*, *Last 30 Days*, or *All Time*.
- **1-Click Export to CSV**: Download sales and line-item summaries formatted for accountants and GST filing.
- **User Registration & Audit Logs**: Register new branch staff and inspect Supabase authentication access logs.

---

### 7. Thermal Printing & WhatsApp Bill Delivery
- **Thermal & Standard Print Layout (`/receipt`)**:
  - Pre-styled for **2-inch / 3-inch thermal POS receipt printers** (58mm / 80mm ESC/POS) and desktop A4/A5 printers.
  - Automatically hides navigation headers and action buttons during print execution.
- **1-Click WhatsApp Invoice Share**:
  - Formats an itemized bill breakdown into a WhatsApp message link sent directly to the customer's phone number.
- **Batch Barcode Label Sheet (`/batch-labels`)**:
  - Formats an entire **A4 24-Up Sticker Grid** for printing barcode stickers in bulk after receiving new stock.

---

## 👥 User Roles & Access Control

The portal enforces 3 distinct roles using JWT metadata and Next.js middleware:

| Feature / URL | 👑 **OWNER** | 👔 **MANAGER** | 🛍️ **STAFF / CASHIER** |
| :--- | :---: | :---: | :---: |
| **Branch Scope** | All Showrooms | Assigned Branch Only | Assigned Branch Only |
| **Owner Dashboard (`/dashboard`)** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **Staff Registration (`/dashboard/users`)** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **Audit Logs (`/dashboard/audit`)** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **POS Billing (`/sale`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Stock Inward (`/add-stock`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Stock Transfers (`/transfer`)** | ✅ Full Access | ✅ Full Access | 🟡 Branch Staff |
| **Returns & Exchanges (`/returns`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Shift Close (`/day-close`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access |

---

## 🗄 Database Data Model

```prisma
enum Role {
  OWNER
  MANAGER
  STAFF
}

enum StockMovementType {
  PURCHASE_IN
  SALE_OUT
  TRANSFER_IN
  TRANSFER_OUT
  RETURN_IN
  ADJUSTMENT
}

enum PaymentMode {
  CASH
  UPI
  CARD
  SPLIT
}
```

Key models defined in `prisma/schema.prisma`:
- `Branch`: Showroom location details.
- `User`: Cashiers, managers, and owners linked to Supabase Auth.
- `Saree`: Shared product catalog (name, fabric, color, cost price, selling price, barcode SKU, image URL).
- `Stock`: On-hand quantity per saree per branch.
- `StockMovement`: Append-only audit ledger of every inventory change.
- `Sale` & `SaleItem`: Invoices, line items, payment modes, and customer information.
- `TransferRequest`: Inter-branch inventory dispatch orders.
- `ReturnRecord` & `ReturnItem`: Saree return and exchange audit logs.
- `DayClosure`: Shift closing cash reconciliation records.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- A free [Supabase](https://supabase.com) project

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhaveshnivas77392/sarees-billing-portal.git
   cd sarees-billing-portal
   git checkout modernize-ui
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase connection strings and API keys (see [Environment Variables Reference](#-environment-variables-reference)).

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Push the database schema**:
   ```bash
   npm run db:push
   ```

5. **Enable Supabase Realtime**:
   In your Supabase dashboard SQL Editor, run `prisma/enable-realtime.sql` once.

6. **Seed Initial Branches & Logins**:
   ```bash
   npm run seed
   ```
   *This outputs generated login credentials for the Owner and Branch accounts.*

7. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `eyJhbGci...` |
| `DATABASE_URL` | Postgres PgBouncer Pooled Connection (Port 6543) | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Postgres Direct Connection (Port 5432) | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres` |
| `NEXT_PUBLIC_SHOP_NAME` | Business Name displayed on bills & UI | `"Sri Laxmi Narasimha Silk Sarees"` |
| `NEXT_PUBLIC_UPI_ID` | Bank UPI VPA handle for Dynamic QR generation | `"srilaxminarasimhasarees@okaxis"` |

---

## 🧪 Automated Testing Suite

The application includes automated unit and integration tests powered by **Vitest** and **React Testing Library**:

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- POS catalog rendering and category filtering
- Barcode item addition and stock quantity clamping
- Preset discount percentage and flat math calculations
- Dynamic NPCI UPI QR string generation
- Split payment balance verification

---

## 🚀 Production Deployment Guide (Vercel + Supabase)

1. Push your code to your GitHub repository.
2. In [Vercel](https://vercel.com), import the repository as a **Next.js** project.
3. Configure all environment variables in **Project Settings > Environment Variables**.
4. Click **Deploy**.
5. Once deployed, open the URL on mobile phones or tablets and tap **"Add to Home Screen"** to install as a standalone PWA.

---

## ⚡ Performance & Concurrency Handling

1. **Transaction Pooling**: Connects via PgBouncer (`port 6543`) to support hundreds of concurrent billing terminals without exhausting database connection limits.
2. **Race-Condition Proof Checkouts**: Guarded SQL decrements (`quantity: { decrement: qty }` where `quantity >= qty`) guarantee stock counts never drift or turn negative.
3. **PWA Mobile Ready**: Optimized touch targets ($\ge 44\text{px}$) and offline-friendly assets for tablets and counter phones.

---

## 📄 License

MIT License. Contributions and commercial retail deployments welcome.
