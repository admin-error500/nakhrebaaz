# NakhreBaaz — fixes and testing

## Changes
- Customer order history shows **order** and **payment** states distinctly. Delivered COD is not automatically paid.
- Admin has **MARK COD PAYMENT RECEIVED** on delivered COD orders, only after cash was actually received.
- Delivered step shows a checkmark.
- Inventory is per **variant**, not just product. Stock is reserved when checkout creates an order; a cancelled order restores it once.
- Fixed missing `releaseStock()` for failed Razorpay order initialization.
- Added optional `festival` to Product and festival filters + admin product form.
- Added one-time seed script for three demo products, **each with exactly one M/Black unit**.

## Run
1. Keep your own `.env` in project root. Do not share credentials.
2. `npm install`
3. `npx prisma generate`
4. `node prisma/seed-stock-tests.cjs`
5. `npm run build` and `npm run dev`

**Do not run `prisma db push` without reviewing MongoDB indexes**: your paymentOrderId partial unique index is manually managed, and Prisma may alter it.

## Three one-unit test orders
1. Sign in, go to **Diwali**, open **TEST • Diwali Nakhra Tee**, choose M/Black, place **one COD order**.
2. Reload its product page. The only variant should say **Sold out**, and **ADD TO BAG** is disabled.
3. Repeat for **TEST • Holi Color Tee** and **TEST • Navratri Rebel Tee**. Each begins with 1 unit and should end with 0.
4. Admin `/admin` → Inventory should display `M/Black: 0 (OUT OF STOCK)` for each.
5. Admin `/admin` → Accept → Packed → Shipped → Delivered. Customer `/account` shows Delivered · COD payment pending until admin confirms actual cash received.
6. If a test order is rejected/cancelled before shipment, stock should return to 1. Do not cancel real paid orders without handling refund.

**Note:** The seed script does not reset inventory if rerun. No live orders are placed automatically; you must place the three COD test orders through the website. Test products use sample photos, not original festival graphic art.
