import Link from "next/link";
export const metadata={title:"Refund Policy | NakhreBaaz"};
export default function RefundPolicy(){return <main className="policy-page">
 <h1>Refund Policy</h1>
 <p>NakhreBaaz processes eligible and approved refunds within <strong>10 working days</strong> after the refund is approved. Working days exclude Sundays and applicable public/bank holidays. The payment provider or bank may require additional time before funds appear in your account.</p>
 <h2>When can a refund be approved?</h2>
 <p>Refunds may apply to a successfully cancelled prepaid order before packing, an accepted return for a damaged or defective product, or other cases where a refund is required by applicable law.</p>
 <h2>How will I receive the refund?</h2>
 <p>For prepaid orders, refunds are normally sent to the original payment method through the payment provider. For cash-on-delivery returns, support will coordinate an appropriate refund method after approval. Never share passwords, OTPs, or card PINs to receive a refund.</p>
 <h2>Processing timeline</h2>
 <p>The 10-working-day processing period starts only after the refund is approved, not automatically on the date of a return request or cancellation. You may contact support with your order ID if an approved refund has not been processed within that period.</p>
 <h2>Refund status</h2>
 <p>An order being marked <strong>CANCELLED</strong> does not mean that money has already been refunded. Refund processing and confirmation are separate steps.</p>
 <p>See also our <Link href="/policies/returns">Return Policy</Link> and <Link href="/policies/cancellation">Cancellation Policy</Link>.</p>
 </main>;}