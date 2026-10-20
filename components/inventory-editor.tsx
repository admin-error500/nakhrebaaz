"use client";
import { useEffect, useState, type FormEvent } from "react";
type InventoryIconProps={size?:number;strokeWidth?:number;"aria-hidden"?:string};
function Pencil({size=16,strokeWidth=2}:InventoryIconProps){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 5 3 3M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z"/></svg>;}
function X({size=20}:InventoryIconProps){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>;}
function Trash2({size=19}:InventoryIconProps){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7"/></svg>;}
function Plus({size=16}:InventoryIconProps){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>;}
import { useRouter } from "next/navigation";

export type InventoryVariant={id:string;size:string;color:string;stock:number;sku:string;sold:number};
export type InventoryProduct={id:string;name:string;description:string;image:string;price:number;category:string;festival:string|null;active:boolean;sold:number;variants:InventoryVariant[]};
type DraftVariant={id?:string;size:string;color:string;stock:number;sku:string;addStock:number};
type Draft={name:string;description:string;image:string;price:number;category:string;festival:string;active:boolean;variants:DraftVariant[]};
const emptyVariant=():DraftVariant=>({size:'',color:'',stock:0,sku:'',addStock:0});
const toDraft=(p:InventoryProduct):Draft=>({
  name:p.name,description:p.description,image:p.image,price:p.price,
  category:p.category,festival:p.festival??'',active:p.active,
  variants:p.variants.map(v=>({...v,addStock:0})),
});
export function InventoryEditor({products,totalSold,totalAvailable,initialEditId,editOnSeparatePage=false,nextCursor:initialCursor=null}:{products:InventoryProduct[];totalSold:number;totalAvailable:number;initialEditId?:string;editOnSeparatePage?:boolean;nextCursor?:string|null}){
  const router=useRouter();
  const [editing,setEditing]=useState<string|null>(initialEditId??null);
  const [draft,setDraft]=useState<Draft|null>(()=>initialEditId?toDraft(products.find(p=>p.id===initialEditId)??products[0]):null);
  const [working,setWorking]=useState(false);
  const [inventoryRows,setInventoryRows]=useState(products);
  const [nextCursor,setNextCursor]=useState(initialCursor);
  const [pageBusy,setPageBusy]=useState(false);
  const [pageError,setPageError]=useState("");
  async function loadMoreInventory(){
    if(!nextCursor||pageBusy)return;
    setPageBusy(true);setPageError("");
    try{
      const res=await fetch("/api/admin/inventory/page?cursor="+encodeURIComponent(nextCursor),{cache:"no-store"});
      const json=await res.json() as {products?:InventoryProduct[];nextCursor?:string|null;error?:string};
      if(!res.ok)throw new Error(json.error||"Unable to load inventory");
      setInventoryRows(old=>{
       const ids=new Set(old.map(p=>p.id));
       return [...old,...(json.products??[]).filter(p=>!ids.has(p.id))];
      });
      setNextCursor(json.nextCursor??null);
    }catch(e){setPageError(e instanceof Error?e.message:"Unable to load inventory");}
    finally{setPageBusy(false);}
  }
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{ if(editing) document.getElementById("inventory-editor")?.scrollIntoView({behavior:"smooth",block:"start"}); },[editing]);
  const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
  const change=(field:keyof Omit<Draft,'variants'>,value:string|number|boolean)=>{
    setDraft(d=>d?{...d,[field]:value}:d);
  };
  const changeVariant=(index:number,field:keyof DraftVariant,value:string|number)=>{
    setDraft(d=>d?{...d,variants:d.variants.map((v,i)=>i===index?{...v,[field]:value}:v)}:d);
  };
  const start=(p:InventoryProduct)=>{
    setEditing(p.id);setDraft(toDraft(p));setError('');setNotice('');
  };
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!draft||!editing)return;
    setWorking(true);setError('');setNotice('');
    try{
      if(draft.variants.some(v=>v.addStock<0||!Number.isInteger(v.addStock)))throw new Error('Add Stock should be a non-negative whole number');
      const data={...draft,festival:draft.festival||null,variants:draft.variants.map(v=>({
        ...(v.id?{id:v.id}:{}),size:v.size,color:v.color,sku:v.sku,stock:v.stock+v.addStock,
      }))};
      const res=await fetch('/api/admin/products/'+editing,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const json=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(json.error||'Unable to update product');
      setEditing(null);setDraft(null);setNotice('Product updated successfully.');if(initialEditId)router.push('/admin/inventory');else router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Update failed');}
    finally{setWorking(false);}
  }
  async function remove(p:InventoryProduct){
    if(!window.confirm('Delete "'+p.name+'"? Products linked to past orders will be archived and hidden from the store, not erased.'))return;
    setWorking(true);setError('');setNotice('');
    try{
      const res=await fetch('/api/admin/products/'+p.id,{method:'DELETE'});
      const json=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(json.error||'Unable to delete product');
      setEditing(null);setDraft(null);
      setNotice(json.message||'Product removed.');if(initialEditId)router.push('/admin/inventory');else router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Delete failed');}
    finally{setWorking(false);}
  }
  return <section className="admin-block" id="inventory">
    <div className="admin-heading"><div><span className="eyebrow">YOUR CATALOGUE</span><h2>INVENTORY</h2></div><span className="admin-count">{inventoryRows.length} LOADED</span></div>
    {!initialEditId && <>
    <div className="admin-summary-grid">
      <div className="admin-summary-stat"><small>AVAILABLE STOCK</small><strong>{totalAvailable}</strong><span>Units remaining across active products and variants</span></div>
    </div>
    <p className="admin-packing-note">Available stock is live. Sales counts are shown per loaded product; cancelled orders and unverified online payments are excluded.</p>
    {notice&&<p role="status" className="admin-notice">{notice}</p>}
    {error&&<p role="alert" className="error">{error}</p>}
    <div className="tablewrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sold</th><th>Available</th><th className="inventory-manage-heading">Edit</th></tr></thead>
      <tbody>{inventoryRows.map(p=><tr key={p.id}>
        <td><strong>{p.name}</strong>{!p.active&&<small className="inventory-archived"> (Archived)</small>}<small className="inventory-secondary">{p.variants.map(v=>v.size+'/'+v.color+': '+v.stock+' left / '+v.sold+' sold').join(', ')}</small></td>
        <td>{p.category}{p.festival?' · '+p.festival:''}</td><td>{money(p.price)}</td>
        <td>{p.sold}</td><td>{p.active?p.variants.reduce((sum,v)=>sum+v.stock,0):0}</td>
        <td>{editOnSeparatePage?<a href={"/admin/products/"+p.id} className="admin-action inventory-edit-trigger" aria-label={"Edit "+p.name}><Pencil size={15} strokeWidth={2} aria-hidden="true"/><span>Edit</span></a>:<button type="button" className="admin-action inventory-edit-trigger" aria-label={"Edit "+p.name} onClick={()=>start(p)}><Pencil size={15} strokeWidth={2} aria-hidden="true"/><span>Edit</span></button>}</td>
      </tr>)}</tbody></table></div>
    {pageError&&<p role="alert" className="error">{pageError}</p>}
    {nextCursor&&<button className="load-next-batch" type="button" disabled={pageBusy} onClick={()=>void loadMoreInventory()}>{pageBusy?"LOADING…":"SHOW NEXT 20 PRODUCTS ↓"}</button>}
    </>}
    {draft&&editing&&<form className="inventory-edit-form" onSubmit={save} id="inventory-editor">
      <div className="admin-heading"><div><span className="eyebrow">SELECTED PRODUCT</span><h3>EDIT PRODUCT</h3></div>
        <button type="button" className="inventory-icon-button inventory-close" aria-label="Close edit section" title="Close" onClick={()=>{if(initialEditId)router.push('/admin/inventory');else {setEditing(null);setDraft(null);setError('');}}} disabled={working}><X size={20} aria-hidden="true"/></button></div>
      <div className="inventory-edit-grid">
        <label>Product name<input required minLength={3} value={draft.name} onChange={e=>change('name',e.target.value)}/></label>
        <label>Price (₹)<input required type="number" min="1" step="1" value={draft.price} onChange={e=>change('price',Number(e.target.value))}/></label>
        <label>Category<select value={draft.category} onChange={e=>change('category',e.target.value)}>{['Men','Women','Kids','Mugs','Keychains'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>Festival<select value={draft.festival} onChange={e=>change('festival',e.target.value)}>{['','Diwali','Holi','Navratri','Raksha Bandhan','Eid','Christmas'].map(v=><option key={v} value={v}>{v||'Everyday / None'}</option>)}</select></label>
        <label className="inventory-wide">Description<textarea required minLength={5} rows={4} value={draft.description} onChange={e=>change('description',e.target.value)} /></label>
        <label className="inventory-wide">Product image URL (Cloudinary HTTPS link)<input required type="url" value={draft.image} onChange={e=>change('image',e.target.value)}/></label>
        <label className="inventory-wide inventory-visibility"><input type="checkbox" checked={draft.active} onChange={e=>change('active',e.target.checked)} /> Active — show product on website</label>
      </div>
      <h4>Variant, Color, SKU & Stock</h4>
      <p className="admin-packing-note">Set Stock replaces current quantity. Add Stock increases it when you save. Example: current 0 + add 5 = 5.</p>
      {draft.variants.map((v,i)=><div key={v.id??'new-'+i} className="inventory-variant-row">
        <label>Size / Option<input required value={v.size} onChange={e=>changeVariant(i,'size',e.target.value)}/></label>
        <label>Color<input required value={v.color} onChange={e=>changeVariant(i,'color',e.target.value)}/></label>
        <label>SKU<input required minLength={3} value={v.sku} onChange={e=>changeVariant(i,'sku',e.target.value)}/></label>
        <label>Set Stock<input required type="number" min="0" step="1" value={v.stock} onChange={e=>changeVariant(i,'stock',Number(e.target.value))}/></label>
        <label>Add Stock (+)<input type="number" min="0" step="1" value={v.addStock} onChange={e=>changeVariant(i,'addStock',Number(e.target.value))}/></label>
        <button type="button" className="inventory-icon-button inventory-remove-variant" aria-label={"Remove size "+v.size+" color "+v.color} title={draft.variants.length<=1?"At least one size/color is required":"Remove size/color"} disabled={draft.variants.length<=1||working} onClick={()=>setDraft(d=>d?{...d,variants:d.variants.filter((_,idx)=>idx!==i)}:d)}><Trash2 size={19} aria-hidden="true"/></button>
      </div>)}
      <button type="button" className="admin-action inventory-add-variant" onClick={()=>setDraft(d=>d?{...d,variants:[...d.variants,emptyVariant()]}:d)} disabled={working}><Plus size={16} aria-hidden="true"/> Add</button>
      {error&&<p role="alert" className="error">{error}</p>}
      <div className="inventory-edit-actions">
        <button type="submit" className="btn dark" disabled={working}>{working?'SAVING...':'Update'}</button>
        <button type="button" className="admin-action danger" disabled={working} onClick={()=>{const p=products.find(x=>x.id===editing);if(p)void remove(p);}}>Delete</button>
      </div>
    </form>}
  </section>;
}
