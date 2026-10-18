import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic="force-dynamic";
export default async function AdminOverview(){
 const [orders,products,variants]=await Promise.all([
  db.order.findMany({select:{total:true,paymentStatus:true,status:true}}),
  db.product.count(),
  db.variant.aggregate({_sum:{stock:true}}),
 ]);
 const received=orders.filter(o=>o.paymentStatus==="PAID").reduce((sum,o)=>sum+o.total,0);
 const pending=orders.filter(o=>o.status==="PENDING").length;
 return <section className="admin-block">
  <div className="admin-heading"><div><span className="eyebrow">STORE OVERVIEW</span><h2>ORDER & PAYMENT SUMMARY</h2></div></div>
  <div className="admin-summary-grid admin-multipage-stats">
   <div className="admin-summary-stat"><small>TOTAL ORDERS</small><strong>{orders.length}</strong><span>All order statuses</span></div>
   <div className="admin-summary-stat"><small>PAYMENTS RECEIVED</small><strong>₹{received.toLocaleString("en-IN")}</strong><span>Paid orders before refunds</span></div>
   <div className="admin-summary-stat"><small>PENDING ORDERS</small><strong>{pending}</strong><span>Awaiting confirmation</span></div>
   <div className="admin-summary-stat"><small>PRODUCTS</small><strong>{products}</strong><span>{variants._sum.stock??0} units in inventory</span></div>
  </div>
  <div className="admin-page-shortcuts">
   <Link href="/admin/orders">Manage Orders ↗</Link>
   <Link href="/admin/inventory">View Inventory ↗</Link>
   <Link href="/admin/sales">Manage Sales ↗</Link>
   <Link href="/admin/products/new">Add Product ↗</Link>
  </div>
 </section>;
}
