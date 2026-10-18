"use client";
import Link from "next/link";
import {useState} from "react";
import {OrderTracker} from "@/components/order-tracker";
import type {OrderCard} from "@/lib/order-pages";
export function UserOrderHistory({initial,nextCursor:initialCursor}:{initial:OrderCard[];nextCursor:string|null}){
 const [orders,setOrders]=useState(initial),[cursor,setCursor]=useState(initialCursor);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function loadMore(){
  if(!cursor||busy)return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/account/orders?cursor="+encodeURIComponent(cursor),{cache:"no-store"});
   const data=await res.json() as {orders?:OrderCard[];nextCursor?:string|null;error?:string};
   if(!res.ok)throw new Error(data.error||"Unable to load orders");
   setOrders(old=>{
    const seen=new Set(old.map(o=>o.id));
    return [...old,...(data.orders??[]).filter(o=>!seen.has(o.id))];
   });
   setCursor(data.nextCursor??null);
  }catch(e){setError(e instanceof Error?e.message:"Retry loading orders");}
  finally{setBusy(false);}
 }
 return <section className="account-panel" id="orders">
  <div className="panel-heading"><div><span className="eyebrow">YOUR SHOPPING STORY</span><h2>MY ORDERS</h2></div>
   <Link href="/shop" className="account-shop-link">SHOP MORE ↗</Link>
  </div>
  {orders.length===0?<div className="orders-empty"><h3>NO ORDERS. YET.</h3><p>Find a fit that matches your attitude.</p><Link href="/shop" className="btn dark">EXPLORE THE DROP ↗</Link></div>:
  <div className="order-stack">{orders.map(o=><article className="order-modern" key={o.id}>
   <div><small>ORDER #{o.id.slice(-8).toUpperCase()}</small><strong>{new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</strong></div>
   <div><small>STATUS</small><span className="order-status">{o.status}<span className="payment-label"> · {o.paymentMethod==="COD"?(o.paymentStatus==="PAID"?"COD received":"COD payment pending"):(o.paymentStatus==="PAID"?"Online paid":"Online payment pending")}</span></span></div>
   <div><small>TOTAL</small><strong>₹{o.total.toLocaleString("en-IN")}</strong></div>
   <div className="order-tracker-row"><OrderTracker status={o.status} paymentStatus={o.paymentStatus} paymentMethod={o.paymentMethod}/></div>
   <div className="order-history-products">{o.items.map(i=><p key={i.id}>{i.productId?<Link href={`/product/${i.productId}`} className="order-product-link">{i.name} ↗</Link>:<strong>{i.name}</strong>} ({i.size}/{i.color}) ×{i.quantity}</p>)}</div>
   {o.paymentStatus==="PAID"&&o.items.length===1&&<a className="invoice-download-link" href={`/api/orders/${o.id}/invoice`} download>DOWNLOAD INVOICE ↓</a>}
  </article>)}</div>}
  {error&&<p role="alert" className="error">{error}</p>}
  {cursor&&<button type="button" className="load-next-batch" onClick={()=>void loadMore()} disabled={busy}>{busy?"LOADING…":"SHOW NEXT 10 ORDERS ↓"}</button>}
 </section>;
}
