"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type SaleAdminProduct={id:string;name:string;price:number;category:string;image:string;discountPercent:number};
export type SaleAdminCampaign={
 enabled:boolean;title:string;subtitle:string;imageUrl:string|null;
 buttonText:string;buttonUrl:string;startsAt:string|null;endsAt:string|null;
};
const localDate=(date:string|null)=>{
 if(!date)return "";
 const d=new Date(date),two=(n:number)=>String(n).padStart(2,"0");
 return [d.getFullYear(),two(d.getMonth()+1),two(d.getDate())].join("-")+"T"+two(d.getHours())+":"+two(d.getMinutes());
};
export function SaleManagement({initial,products}:{initial:SaleAdminCampaign;products:SaleAdminProduct[]}){
 const router=useRouter();
 const [enabled,setEnabled]=useState(initial.enabled);
 const [title,setTitle]=useState(initial.title);
 const [subtitle,setSubtitle]=useState(initial.subtitle);
 const [imageUrl,setImageUrl]=useState(initial.imageUrl??"");
 const [buttonText,setButtonText]=useState(initial.buttonText);
 const [buttonUrl,setButtonUrl]=useState(initial.buttonUrl);
 const [startsAt,setStartsAt]=useState(initial.startsAt?localDate(initial.startsAt):"");
 const [endsAt,setEndsAt]=useState(initial.endsAt?localDate(initial.endsAt):"");
 const [discounts,setDiscounts]=useState<Record<string,number>>(()=>Object.fromEntries(products.map(p=>[p.id,p.discountPercent])));
 const [filter,setFilter]=useState("");
 const [working,setWorking]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const discountedCount=products.filter(p=>(discounts[p.id]??0)>0).length;
 const matches=products.filter(p=>p.name.toLowerCase().includes(filter.trim().toLowerCase())||p.category.toLowerCase().includes(filter.trim().toLowerCase()));
 function onDiscount(id:string,value:number){setDiscounts(old=>({...old,[id]:Math.min(90,Math.max(0,Math.trunc(value||0)))}));}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setWorking(true);setError("");setNotice("");
  try{
   const toUtc=(value:string)=>value?new Date(value).toISOString():null;
   if(startsAt&&endsAt&&new Date(endsAt)<=new Date(startsAt))throw new Error("End time must be later than start time");
   const response=await fetch("/api/admin/sale",{method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({campaign:{enabled,title,subtitle,imageUrl:imageUrl||null,buttonText,buttonUrl,
      startsAt:toUtc(startsAt),endsAt:toUtc(endsAt)},
      discounts:products.map(p=>({productId:p.id,percent:discounts[p.id]??0}))})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result.error||"Cannot save sale");
   setNotice("Sale saved. Storefront and checkout now use the latest settings.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save sale");}
  finally{setWorking(false);}
 }
 return <section className="admin-block" id="sale-management">
  <div className="admin-heading"><div><span className="eyebrow">PROMOTIONS</span><h2>SALE MANAGEMENT</h2></div><span className="admin-count">{discountedCount} SELECTED</span></div>
  <p>Set a separate percentage for every product. Use 0% for no discount. Master switch controls banner and all discounts.</p>
  <form className="sale-admin-form" onSubmit={save}>
   <label className="sale-toggle"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> <strong>SALE {enabled?"ON":"OFF"}</strong><span>{enabled?"Selected discounts and banner are enabled during the chosen dates.":"Banner and all discounts are switched off."}</span></label>
   <div className="sale-admin-fields">
    <label>Sale title<input required maxLength={90} value={title} onChange={e=>setTitle(e.target.value)} /></label>
    <label>Banner subtitle<input maxLength={180} value={subtitle} onChange={e=>setSubtitle(e.target.value)} /></label>
    <label>Banner image URL (optional)<input type="url" placeholder="https://..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)} /></label>
    <label>Button text<input required maxLength={40} value={buttonText} onChange={e=>setButtonText(e.target.value)} /></label>
    <label>Button link<input required pattern="/(?!/).*" title="Internal path such as /#shop" value={buttonUrl} onChange={e=>setButtonUrl(e.target.value)} /></label>
    <label>Starts at (optional, local time)<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} /></label>
    <label>Ends at (optional, local time)<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} /></label>
   </div>
   <div className="sale-products-heading"><h3>SELECT PRODUCT DISCOUNTS</h3><input aria-label="Search products for sale" placeholder="Search product or category" value={filter} onChange={e=>setFilter(e.target.value)} /></div>
   <div className="sale-products-list">{matches.map(p=>{
    const percent=discounts[p.id]??0;
    const salePrice=percent>0?Math.max(1,Math.round(p.price*(100-percent)/100)):p.price;
    return <div className="sale-product-row" key={p.id}>
      <img alt="" src={p.image} loading="lazy"/>
      <div className="sale-product-name"><strong>{p.name}</strong><span>{p.category} · Regular ₹{p.price.toLocaleString("en-IN")}</span></div>
      <label>Discount %<input type="number" min="0" max="90" step="1" value={percent} onChange={e=>onDiscount(p.id,Number(e.target.value))}/></label>
      <div className="sale-product-result"><strong>{percent>0?percent+"% OFF":"No Sale"}</strong><span>₹{salePrice.toLocaleString("en-IN")}</span></div>
    </div>;
   })}{matches.length===0&&<p>No matching products.</p>}</div>
   {notice&&<p role="status" className="admin-notice">{notice}</p>}
   {error&&<p role="alert" className="error">{error}</p>}
   <button className="btn dark" type="submit" disabled={working}>{working?"SAVING...":"SAVE SALE SETTINGS"}</button>
   <p className="muted">Saved amounts use whole rupees. Discounts apply only to selected products, including cart, COD and online checkout. Existing orders keep their original paid prices.</p>
  </form>
 </section>;
}
