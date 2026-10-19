import Link from "next/link";
export const metadata={title:"Cancellation Policy | NakhreBaaz"};
export default function CancellationPolicy(){return <main className="policy-page">
 <h1>Order Cancellation Policy</h1>
 <p>You can cancel your NakhreBaaz order only before packing begins.</p>
 <h2>When can I cancel?</h2>
 <p>Orders with status <strong>PENDING</strong> or <strong>CONFIRMED</strong> can be cancelled from <Link href="/account/orders">My Orders</Link>, provided any online payment verification has completed.</p>
 <p>After the order status becomes <strong>PACKED</strong>, cancellation is no longer available, including after shipping or delivery.</p>
 <h2>What happens after cancellation?</h2>
 <p>Once cancellation succeeds, the order is marked CANCELLED. Cash-on-delivery orders do not require a payment refund. For prepaid orders, any refund must be processed separately; cancellation confirmation does not mean a refund has been issued.</p>
 <p>Approved refunds will be processed within 10 working days. See our <Link href="/policies/refunds">Refund Policy</Link>.</p>
 <p>If your online payment is still being verified, please wait or contact support before trying to cancel.</p>
 </main>;}