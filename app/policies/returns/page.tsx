import Link from "next/link";
export const metadata={title:"Return Policy | NakhreBaaz"};
export default function ReturnPolicy(){return <main className="policy-page">
 <h1>Return Policy</h1>
 <p>We accept return requests for products that arrive damaged or defective. We do not offer returns for change of mind, personal preference, or other non-damage reasons, subject to applicable consumer rights.</p>
 <h2>When is a return eligible?</h2>
 <p>A product is eligible for review when it arrived damaged, defective, or materially different from what was ordered. Please report the problem as soon as possible after delivery.</p>
 <h2>How to request a return</h2>
 <p>Contact our support team with the order ID, a description of the issue, and clear photographs of the product and packaging. Please keep the item and its packaging available while we review the request. Support contact details must be published before the store launches.</p>
 <p>We will review the evidence and provide instructions for an approved return. No return should be shipped without confirmation from support.</p>
 <h2>Refund on approved return</h2>
 <p>Once a valid return is received and approved, refund processing follows our <Link href="/policies/refunds">Refund Policy</Link>. Applicable statutory rights remain unaffected.</p>
 <p>To cancel an order before packing, see the <Link href="/policies/cancellation">Cancellation Policy</Link>.</p>
 </main>;}