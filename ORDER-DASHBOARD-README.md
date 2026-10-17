# Order management update

Admin: `/admin` (requires an existing user with role `ADMIN`). Customers: `/account` (requires login).

Allowed transitions: PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED. PENDING, CONFIRMED and PACKED can be cancelled; SHIPPED and DELIVERED cannot be cancelled from this UI. Stock is restored once on cancellation. Online orders cannot progress until paymentStatus is PAID.

**Refunds:** Cancellation of an already paid order does not initiate a Razorpay refund. Handle refunds manually and verify them before telling the customer they are complete.

**Limitations:** No carrier integration, tracking number, automated emails, refund workflow, or persistent status-change audit history. The customer sees the latest saved status when `/account` is loaded/refreshed, not push notifications. Test with fake/test orders first. This is a development starter, not a fully audited production fulfilment system.

Install in a separate directory, copy your own `.env` locally (never share it), `npm install`, `npx prisma generate`, `npm run build`, then `npm run dev`. No Prisma schema migration is needed for these changes.
