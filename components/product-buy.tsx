"use client";
import {useState} from "react";
import {useCart} from "./cart";
import {useRouter} from "next/navigation";
import {isMugCategory,mugVariantStyle,MUG_STYLES,mugSwatch} from "@/lib/mug-options";

type Variant={id:string;size:string;color:string;stock:number};
type Product={id:string;name:string;price:number;image:string;category:string;variants:Variant[]};
export function ProductBuy({product}:{product:Product}){
 const {add}=useCart(),router=useRouter();
 const mug=isMugCategory(product.category);
 const initial=product.variants.find(v=>v.stock>0)??product.variants[0];
 const [selected,setSelected]=useState(initial?.id??"");
 const chosen=product.variants.find(v=>v.id===selected);
 const activeStyle=mugVariantStyle(chosen?.size??"",product.category);
 const variants=mug?product.variants.filter(v=>mugVariantStyle(v.size,product.category)===activeStyle):product.variants;
 function chooseStyle(style:string){
  const matching=product.variants.filter(v=>mugVariantStyle(v.size,product.category)===style);
  setSelected((matching.find(v=>v.stock>0)??matching[0])?.id??"");
 }
 return <div>
  {mug?<>
   <label>CHOOSE MUG TYPE</label>
   <div className="variant-list mug-style-picker">{MUG_STYLES.filter(s=>product.variants.some(v=>mugVariantStyle(v.size,product.category)===s.name)).map(s=>{
    const related=product.variants.filter(v=>mugVariantStyle(v.size,product.category)===s.name);
    return <button key={s.code} type="button" className={activeStyle===s.name?"chosen":""} disabled={related.every(v=>v.stock<1)} onClick={()=>chooseStyle(s.name)}>{s.name} Mug{related.every(v=>v.stock<1)?" · Sold out":""}</button>;
   })}</div>
   <label>CHOOSE MUG COLOUR</label>
  </>:<label>{product.category==="Caps"?"CHOOSE CAP FIT / COLOUR":product.category==="Keychains"?"CHOOSE OPTION / COLOR":"SELECT SIZE & COLOR"}</label>}
  <div className="variant-list">{variants.map(v=><button key={v.id} type="button" className={selected===v.id?"chosen":""} disabled={v.stock<1} onClick={()=>setSelected(v.id)}>
   {mug?<span className="variant-mug-choice"><span className="variant-mug-swatch" style={{backgroundColor:mugSwatch(v.color)}} aria-hidden="true"/>{v.color}</span>:v.size+" / "+v.color}
   {v.stock<1?" · Sold out":""}
  </button>)}</div>
  <button type="button" className="btn dark full" disabled={!chosen||chosen.stock<1} onClick={()=>{
   if(!chosen||chosen.stock<1)return;
   add({variantId:chosen.id,quantity:1,name:product.name,price:product.price,size:chosen.size,color:chosen.color,image:product.image});
   router.push("/cart");
  }}>ADD TO BAG — ₹{product.price.toLocaleString("en-IN")} ↗</button>
 </div>;
}
