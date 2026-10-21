import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/shipping";
export const metadata = { title: "Shipping Policy | NakhreBaaz" };
export default function ShippingPolicy() { return <main className="policy-page">
<h1>Shipping Policy</h1>
<p>We offer shipping to serviceable addresses within India. Delivery depends on courier availability, product processing and destination.</p>
<h2>Shipping charges</h2>
<p>Shipping is <strong>free on order subtotals of ₹{FREE_SHIPPING_THRESHOLD.toLocaleString("en-IN")} or more</strong>. For smaller orders the standard shipping charge is <strong>₹{STANDARD_SHIPPING_FEE}</strong>. Any applicable charge is shown before completing checkout.</p>
<h2>Processing and delivery</h2>
<p>Delivery estimates, when provided at checkout or in an order update, are estimates rather than guarantees. Customized or made-to-order products may require additional preparation time. Holidays, peak demand, incorrect addresses and carrier disruptions may cause delays.</p>
<h2>Tracking and delivery attempts</h2>
<p>If tracking details are available from the courier, we will provide them through the available order-contact channel. Keep your phone number, address and PIN code accurate, and respond to delivery attempts. Re-delivery or address correction may result in extra shipping costs if the carrier charges them.</p>
<h2>Problems with a shipment</h2>
<p>If an order arrives damaged, incorrect, incomplete or does not arrive, contact support promptly with your order ID, photographs where appropriate, and tracking details. We will review the issue under our return and refund policies and applicable consumer rights.</p>
</main>; }