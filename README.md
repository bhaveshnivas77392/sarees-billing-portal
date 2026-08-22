# Sarees Billing Portal

A free, open-source, multi-branch billing and inventory portal for a sarees
business. Track what stock each branch holds, add new stock with a printable
barcode label, and bill customers by scanning that barcode - with live stock
and sales updates across every branch and the owner's phone.

## Features

- **Multi-branch inventory** - one shared saree catalog, per-branch stock counts, full audit trail of every stock movement (purchase, sale, adjustment).
- **Barcode billing** - generate a Code128 barcode for every saree design, print it as a label, then scan it at checkout with a USB/Bluetooth barcode scanner *or* a phone camera. Produces a printable customer bill.
- **Live updates everywhere** - a sale at one branch instantly updates stock counts on every other branch's screen and the owner's dashboard, no refresh needed.
- **Installable on phone** - it's a Progressive Web App (PWA); open it once in a phone browser and "Add to Home Screen" to use it like a native app.
- **Role-based access** - the owner sees all branches; branch managers/staff only see and operate their own branch.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) - single codebase for the web UI, API routes, and PWA.
- [Supabase](https://supabase.com) (free tier) - Postgres database, authentication, and Realtime (live updates).
- [Prisma](https://prisma.io) - typed database access and schema migrations.
- [bwip-js](https://github.com/metafloor/bwip-js) - barcode generation for printable labels.
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) - camera-based barcode scanning in the browser.
- Tailwind CSS.

Everything above runs for **$0/month** at the scale of a few branches, on Supabase's and Vercel's free tiers.

## Local setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is enough).
2. Copy `.env.example` to `.env` and fill in the values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - from **Project Settings > API**.
   - `DATABASE_URL` / `DIRECT_URL` - from **Project Settings > Database** (use the pooled connection string for `DATABASE_URL` and the direct one for `DIRECT_URL`).
3. Install dependencies and push the schema:
   ```bash
   npm install
   npm run db:push
   ```
4. Enable live updates: open the **SQL Editor** in your Supabase dashboard and run the contents of `prisma/enable-realtime.sql` once.
5. Seed the 3 branches and one login per role (owner + a manager and staff login per branch):
   ```bash
   npm run seed
   ```
   This prints each generated email/password - change these passwords after first login.
6. Run the app:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in.

### Trying the barcode flow locally without scanner hardware

Open a saree's "Print label" page to see its generated barcode, then on the
"New Sale" screen just type that saree's SKU into the scan box and press
Enter - it behaves exactly like a real barcode scanner would (both a USB/Bluetooth
scanner and this text box just send characters + Enter). Use "Scan with
camera" from a phone to test the real camera-scanning path.

## Deploying your own copy (free)

1. Push this repo to your own GitHub account.
2. Create a [Vercel](https://vercel.com) project from that repo (free tier).
3. Add the same environment variables from your `.env` as Vercel project environment variables. Set `NEXT_PUBLIC_SHOP_NAME` to your shop's name.
4. Deploy. On first deploy, run `npm run db:push` and `npm run seed` once from your local machine (pointed at the same `DATABASE_URL`) to set up the schema and initial logins.
5. On a phone, open the deployed URL and use "Add to Home Screen" to install it as an app.

## Data model

- `Branch` / `User` (role: OWNER, MANAGER, or STAFF, tied to a branch).
- `Saree` - the shared catalog of saree designs (name, fabric, color, prices, barcode SKU).
- `Stock` - current quantity per saree per branch.
- `StockMovement` - append-only audit trail of every purchase-in, sale-out, and adjustment, so stock counts are always explainable.
- `Sale` / `SaleItem` - each checkout and its line items.

See `prisma/schema.prisma` for the full schema.

## Known limitations / possible next steps

- Row Level Security (RLS) is off on the Supabase tables for simplicity - all writes go through server-side Prisma (gated by the app's own role checks), and Realtime subscriptions are read-only broadcasts filtered by branch on the client. For a business with more sensitive data, consider adding RLS policies matching the role checks in `src/lib/auth.ts`.
- No stock-transfer workflow between branches yet (movements support it via `TRANSFER_IN`/`TRANSFER_OUT`, but there's no UI for it).
- No sales reporting beyond "today's sales" on the owner dashboard.
- `npm audit` currently flags one high-severity advisory in Prisma's own CLI config-merging dependency (`deepmerge-ts`, used only by the `prisma` CLI, not the runtime client) - it requires deeply recursive attacker-controlled input to Prisma's local config file, which this app never exposes. Track for a future Prisma patch.

## License

MIT - see `LICENSE`. Contributions welcome.
