"use client";
import Link from "next/link";
import {useCart} from "@/components/cart";
import {useLiveCartPrices} from "@/components/use-live-cart-prices";
export default function Cart(){
 const {items,remove,update}=useCart();
 const {prices,subtotal,shipping,loading,error,unavailable,reload}=useLiveCartPrices();
 const ready=!loading&&!error&&!unavailable;
 return <main className="section narrow">
  <div className="eyebrow">YOUR PICKS</div><h1>Shopping bag ({items.length})</h1>
  {items.length===0?<p>Your bag is empty. <Link href="/">Explore the collection →</Link></p>:<>
   <div className="cart-items">{items.map(i=>{
    const p=prices[i.variantId];
    return <div className="cart-item" key={i.variantId}>
     <img src={i.image} alt=""/><div><b>{i.name}</b><p>{i.size} / {i.color}</p>
     <button className="linkbtn" onClick={()=>remove(i.variantId)}>Remove</button></div>
     <div><b>{p?"₹"+(p.price*i.quantity).toLocaleString("en-IN"):"Checking price..."}</b>
      {p&&p.price<p.originalPrice&&<small className="sale-cart-savings">{p.discountPercent}% OFF <del>₹{(p.originalPrice*i.quantity).toLocaleString("en-IN")}</del></small>}
      <div><button onClick={()=>update(i.variantId,i.quantity-1)}>−</button> {i.quantity} <button onClick={()=>update(i.variantId,i.quantity+1)}>+</button></div>
      {p&&(!p.available||p.stock<i.quantity)&&<small className="error">Insufficient stock</small>}
     </div>
    </div>;
   })}</div>
   <div className="summary"><p>Subtotal <b>{loading?"Verifying…":"₹"+subtotal.toLocaleString("en-IN")}</b></p>
    <p>Shipping <b>{loading?"—":shipping===0?"FREE":"₹"+shipping}</b></p>
    {error&&<p className="error">{error} <button type="button" onClick={()=>void reload()}>Retry</button></p>}
    {unavailable&&!loading&&<p className="error">One or more products are unavailable or need fewer units.</p>}
    {ready?<Link className="btn dark full" href="/checkout">CONTINUE TO CHECKOUT →</Link>:<span className="btn dark full" aria-disabled="true">CHECKING CART PRICES</span>}
   </div>
  </>}
 </main>;
}
