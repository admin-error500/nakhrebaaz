"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";

export type SlideProduct={
 id:string;name:string;image:string;category:string;price:number;originalPrice:number;discountPercent:number;stock:number;variantCount:number;
};
export function FeaturedSlider({products}:{products:SlideProduct[]}){
 const container=useRef<HTMLDivElement>(null);
 const [edges,setEdges]=useState({start:true,end:true});
 const updateEdges=useCallback(()=>{
  const node=container.current;
  if(!node)return;
  const max=Math.max(0,node.scrollWidth-node.clientWidth);
  setEdges({start:node.scrollLeft<=2,end:node.scrollLeft>=max-2});
 },[]);
 useEffect(()=>{
  const node=container.current;
  if(!node)return;
  const observer=new ResizeObserver(updateEdges);
  observer.observe(node);
  node.querySelectorAll(".featured-slide").forEach(child=>observer.observe(child));
  updateEdges();
  return ()=>observer.disconnect();
 },[products,updateEdges]);
 function scroll(direction:-1|1){
  const node=container.current;
  if(!node)return;
  const card=node.querySelector<HTMLElement>(".featured-slide");
  const distance=(card?.offsetWidth??280)+16;
  node.scrollBy({left:distance*direction,behavior:"smooth"});
 }
 return <div className="featured-slider-root">
  <div className="featured-slider-stage">
  <div ref={container} onScroll={updateEdges} className="featured-slider-track" role="region" aria-label="Featured product designs, swipe horizontally" tabIndex={0}>
   {products.map((p,i)=><Link href={`/product/${p.id}`} className="product featured-slide" key={p.id}>
    <div className="product-img"><img src={p.image} alt={p.name} loading={i<3?"eager":"lazy"}/>
     <span className="pill">{p.stock===0?"SOLD OUT":p.discountPercent>0?`${p.discountPercent}% OFF`:"FEATURED"}</span><span className="product-arrow">↗</span>
    </div>
    <div className="product-line"><b>{p.name}</b><span className="sale-price-pair">{p.discountPercent>0&&<del>₹{p.originalPrice.toLocaleString("en-IN")}</del>}<strong>₹{p.price.toLocaleString("en-IN")}</strong></span></div>
    <small>{p.category.toUpperCase()} · {p.stock===0?"OUT OF STOCK":`${p.variantCount} OPTIONS`}</small>
   </Link>)}
  </div>
  <div className="featured-slider-controls" aria-label="Featured design carousel controls">
   <button type="button" aria-label="Previous designs" disabled={edges.start} onClick={()=>scroll(-1)}>&lt;</button>
   <button type="button" aria-label="Next designs" disabled={edges.end} onClick={()=>scroll(1)}>&gt;</button>
  </div>
  </div>
  <p className="featured-swipe-hint">SWIPE TO DISCOVER MORE DESIGNS →</p>
 </div>;
}
