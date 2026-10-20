"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import type {ShopFilters,ShopProduct} from "@/lib/shop-catalog";
import {ProductCardDetails} from "@/components/product-card-details";

export function ShopProductList({initial,nextCursor:initialCursor,filters}:{initial:ShopProduct[];nextCursor:string|null;filters:ShopFilters}){
 const [items,setItems]=useState(initial);
 const [cursor,setCursor]=useState(initialCursor);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const isFetching=useRef(false);
 const requestId=useRef(0);
 const key=JSON.stringify(filters);
 // Filter changes should discard the previous batch and any in-flight response.
 useEffect(()=>{
  requestId.current++;
  setItems(initial);setCursor(initialCursor);setBusy(false);setError("");
 },[key,initial,initialCursor]);
 async function next(){
  if(!cursor||isFetching.current)return;
  isFetching.current=true;setBusy(true);setError("");
  const id=requestId.current;
  const search=new URLSearchParams();
  if(filters.category)search.set("category",filters.category);
  if(filters.type)search.set("type",filters.type);
  if(filters.festival)search.set("festival",filters.festival);
  if(filters.q)search.set("q",filters.q);
  search.set("cursor",cursor);
  try{
   const response=await fetch("/api/shop/products?"+search.toString(),{cache:"no-store"});
   const data=await response.json() as {products?:ShopProduct[];nextCursor?:string|null;error?:string};
   if(!response.ok)throw new Error(data.error||"Unable to load products");
   if(id!==requestId.current)return;
   setItems(prev=>{
    const seen=new Set(prev.map(p=>p.id));
    return [...prev,...(data.products??[]).filter(p=>!seen.has(p.id))];
   });
   setCursor(data.nextCursor??null);
  }catch(e){if(id===requestId.current)setError(e instanceof Error?e.message:"Please retry.");}
  finally{isFetching.current=false;if(id===requestId.current)setBusy(false);}
 }
 return <div>
  <div className="product-meta"><span>{items.length} STYLES LOADED</span><span>✳ MORE TO EXPLORE</span></div>
  <div className="products" id="filtered-products">{items.map((p,i)=><article className="product-card-shell" key={p.id}><Link href={`/product/${p.id}`} className="product">
   <div className="product-img"><img src={p.image} alt={p.name} loading={i<4?"eager":"lazy"}/>
    <span className="pill">{p.stock===0?"SOLD OUT":p.discountPercent>0?`${p.discountPercent}% OFF`:p.festival||(i%3===0?"BESTSELLER":"NEW DROP")}</span><span className="product-arrow">↗</span>
   </div>
   <div className="product-line"><b>{p.name}</b><span className="sale-price-pair">{p.discountPercent>0&&<del>₹{p.originalPrice.toLocaleString("en-IN")}</del>}<strong>₹{p.price.toLocaleString("en-IN")}</strong></span></div>
   <small>{p.category.toUpperCase()} · {p.stock===0?"OUT OF STOCK":`${p.variantCount} OPTIONS`}</small>
  </Link><ProductCardDetails description={p.description} productName={p.name}/></article>)}</div>
  {items.length===0&&<div className="empty-products"><h3>No styles found yet.</h3><p>Try another category or search term.</p><Link href="/shop" className="btn dark">VIEW ALL STYLES</Link></div>}
  {error&&<p role="alert" className="error">{error}</p>}
  {cursor&&<button type="button" className="load-next-batch" onClick={()=>void next()} disabled={busy}>{busy?"LOADING PRODUCTS…":"SEE MORE"}</button>}
 </div>;
}
