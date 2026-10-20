# Nakhrebaaz — MongoDB Edition

This edition uses **MongoDB + Prisma** instead of SQLite. The MongoDB database must be a replica set (MongoDB Atlas clusters already support this).

## Custom designs: email and WhatsApp

Set the following public environment variables in the website deployment (for example Vercel) and redeploy:

```env
NEXT_PUBLIC_CUSTOMIZATION_EMAIL=
NEXT_PUBLIC_CUSTOMIZATION_WHATSAPP_NUMBER=
```

- Use a **verified, monitored business email inbox** and **a verified WhatsApp number in international format** (for India: `91` plus the 10-digit number, no leading `+` necessary).
- The website will show working Email (`mailto:`) and WhatsApp (`wa.me`) buttons under each product and on its product page once valid details are configured. Both contacts are optional, and a missing/invalid value is never replaced by a guessed address or phone number.
- The buttons prefill a product-specific custom-event enquiry. They do **not** create an order or accept an uploaded design; merchant and customer must agree on the customized design and terms separately.
- Personalized clothing is generally non-returnable for change of mind once customized or produced. Legal remedies for defective, damaged, incorrect or materially different goods still apply; see the Return Policy.

## Nakhra Mugs, Caps and product-detail customization

- New mugs are created under one **Mugs** category and can include **Regular** and **Magic** types (selected on the detail page), plus the existing White, Black, Yellow, Pink and Blue colours.
- Type is tracked in the variant size field. Each type/colour combination has its own SKU and stock. The current data model stores a single product price, so Regular and Magic variants of the same design share a price.
- Historic Magic Mugs products remain discoverable inside the Mugs collection to avoid breaking order history; new products should use Mugs.
- Caps are available as a new accessory category, with editable cap fit, colour, stock, SKU, pricing, image and Sale Management.
- Product listing cards show product name, price and stock/options only. **Full product description, custom event offer and Email/WhatsApp enquiry buttons appear only after opening a product.**
- No inventory, images, merchant contacts or demo products were invented.

## Quick start (Ubuntu)

1. Install Node.js 20.9+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set your **MongoDB connection string** (never commit this secret).
4. Set a random `SESSION_SECRET` (at least 32 characters). To seed an admin, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters).
5. Run `npx prisma generate`.
6. Run `npx prisma db push` (MongoDB uses `db push`, not Prisma SQL migrations).
7. Run `npm run db:seed`.
8. Run `npm run dev` and open `http://localhost:3000`.

**Local MongoDB:** a default standalone `mongod` is insufficient for Prisma transactions; configure a single-node replica set or use MongoDB Atlas.

**Razorpay:** Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `.env` for sandbox testing. This is not yet production payment reconciliation; add server-side payment verification against Razorpay, webhooks, idempotency, stock reservation, and refunds before accepting real payments.

**Important:** Existing SQLite data is not automatically copied into MongoDB. This ZIP includes sample data seeding; migrate real records separately. Keep the database connection string and admin password private.

---

# Nakhrebaaz — Full-stack e-commerce starter

A modern Next.js + Prisma storefront for printed T-shirts and hoodies (Men, Women, Kids). Includes user registration/login, cookie-based sessions, product variants and stock, cart, checkout, COD orders, Razorpay order creation and payment-signature verification, order history, and a protected admin dashboard.

## Requirements
- Node.js 20.9+ and npm
- SQLite for local development (managed by Prisma)

## Start on Ubuntu
```bash
cd nakhrebaaz
npm install
cp .env.example .env
# Edit .env: set a long, random SESSION_SECRET (32+ characters)
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```
Visit http://localhost:3000

## Create admin account
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (at least 12 characters), then run `npm run db:seed`. The seed script only creates an admin if that email does not exist; it does not elevate existing customers. Remove these secrets from `.env` when finished if you prefer.

## Razorpay (India)
1. Create a Razorpay merchant account and obtain **test** API keys.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` in `.env`. (Do not put the secret in client code.)
3. Test online checkout. The server creates the order in INR paise, verifies Razorpay's HMAC signature, and updates payment status.
4. Obtain merchant approval and switch to live keys before accepting live payments.

COD works without Razorpay keys. Orders and stock are stored in SQLite. Sample images use third-party Unsplash URLs; replace with images you own and actual product designs before launch.

## Important production work remaining
This is a working **development starter**, not a fully launch-ready commerce platform. Before production: migrate to hosted PostgreSQL and a production database, implement Razorpay webhooks (verified signature, retries, refunds, reconciliation), release timed-out unpaid stock reservations, shipping/pincode validation and carrier tracking, refund/return flows, rate limits and anti-abuse protection, CSRF/origin checks on mutating requests, email verification/password resets, legal/privacy/GST invoice compliance, product image upload/storage, variant editing/deleting, real print assets, automated tests, observability, backups, accessibility audit and deployment. Do not use this version to accept real customer payments without completing these steps.

**Note:** If a customer abandons Razorpay checkout after an order is reserved, stock stays reserved until manually reconciled; this must be addressed before launch. Client callback verification alone is not sufficient for reliable payment reconciliation. Sample size guide and policy/contact copy are placeholders.
