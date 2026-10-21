import Link from "next/link";
export const metadata = { title: "Terms & Conditions | NakhreBaaz" };
export default function Terms() { return <main className="policy-page">
<h1>Terms &amp; Conditions</h1>
<p>These terms govern use of the NakhreBaaz website and orders placed through it. By placing an order, you agree to the applicable product, price, delivery and policy information shown at checkout, subject to applicable law.</p>
<h2>Products, pricing and availability</h2>
<p>We aim to describe products, sizes, colours, prices and availability accurately. Actual screen colours may vary. An order may be declined or cancelled for genuine stock, payment, address-verification or pricing errors; any payment received for an order we cannot fulfil will be handled under applicable refund requirements.</p>
<h2>Orders and payment</h2>
<p>Please provide accurate contact and delivery details. Available payment options and final charges are displayed at checkout. Successful order placement does not by itself confirm a completed refund or guarantee delivery on a particular date.</p>
<h2>Customized products</h2>
<p>For customized clothing, confirm names, spelling, artwork, dimensions, colours and the design proof before approval. Once customized or produced, these items cannot be returned for change of mind or a customer-selected wrong size. This does not restrict remedies for defective, damaged, incorrect or materially misdescribed goods, or statutory consumer rights.</p>
<h2>Order cancellation</h2>
<p>You can cancel a NakhreBaaz order only before packing begins. Orders in <strong>PENDING</strong> or <strong>CONFIRMED</strong> status can be cancelled through <Link href="/account/orders">My Orders</Link>, provided any online payment verification has completed.</p>
<p>Once the order is <strong>PACKED</strong>, cancellation is no longer available, including after shipping or delivery. This does not affect legal remedies for damaged, defective, incorrect or materially misdescribed products.</p>
<p>After a successful cancellation the order is marked <strong>CANCELLED</strong>. Cash-on-delivery orders do not require a payment refund; for prepaid orders any refund is processed separately. Cancellation confirmation is not refund confirmation. Approved refunds are processed within <strong>10 working days</strong> following approval, subject to additional bank or payment-provider posting time.</p>
<p>If online payment verification is still pending, please wait or contact support before cancelling.</p>
<h2>Delivery, returns and refunds</h2>
<p>See our <Link href="/policies/shipping">Shipping Policy</Link> and <Link href="/policies/returns">Refund &amp; Return Policy</Link>. These policies form part of these terms to the extent permitted by applicable law.</p>
<h2>Website content and acceptable use</h2>
<p>Site images, graphics, text, designs and branding may not be copied or reused without permission, except as permitted by law. Do not attempt unauthorised access, fraudulent purchases or misuse of the website.</p>
<h2>Legal rights and contact</h2>
<p>Nothing in these terms excludes or limits rights or remedies that cannot lawfully be excluded. For order questions or disputes, contact the support channel displayed on our website with your order ID.</p>
</main>; }