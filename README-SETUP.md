# NakhreBaaz combined email + PDF patch

This is a PATCH, not a replacement for your entire project. Based on the previously supplied `nakhrebaaz-admin-errors-fixed.zip` snapshot. Back up and compare your current files before replacing; recent local edits may differ.

1. Copy `lib/notifications.ts` and `app/api/orders/[id]/invoice/route.ts` into matching project paths.
2. Merge the included four API route files and `app/account/page.tsx` with your current versions. They contain event triggers and the Order History PDF button.
3. Install `npm install pdfkit` and `npm install -D @types/pdfkit`.
4. Append `styles/email-invoice.css` to your existing `app/styles.css`.
5. Add `.env.example.notifications` settings to `.env` and restart the dev server. Verify your domain with Resend by adding its DNS records in Hostinger; sender address must use a verified domain. Resend testing sender may only send to allowed testing recipients.
6. Run `npx prisma generate && npx tsc --noEmit && npm run dev` and test signup, COD, online payment, admin status, and invoice download.

Events: welcome, COD order placed, verified online payment, confirmed/packed/shipped/delivered/cancelled, COD received. No WhatsApp. Email service is skipped when credentials are missing. Provider failures are logged and do not block order state changes.

Important limitations: This uses direct sends, NOT a durable notification queue. In serverless deployments a retry/outbox system is recommended to guarantee delivery. Signup/email failure is intentionally non-blocking. Do not mark a refund complete until a real refund has succeeded. The PDF is explicitly an ORDER SUMMARY, not a GST-compliant tax invoice. Real GST invoice requires seller legal name/address, GSTIN if applicable, invoice sequence, tax breakup, HSN/SAC, and accounting review. Do not claim it is a tax invoice. The included invoice route checks logged-in ownership.

No live build, Resend API call, or MongoDB test was performed. Existing `.env` and secrets are not included.
