"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {MerchConfig} from "@/lib/merchandising";

type Product={id:string;name:string;category:string;image:string;price:number};
type Group="homepageIds"|"topIds"|"newIds";
const groupInfo:{id:Group;title:string;help:string;shuffle:keyof MerchConfig}[]=[
 {id:"homepageIds",title:"Homepage Featured Designs",help:"Maximum 6 designs. Leave empty to automatically show 6 latest designs.",shuffle:"shuffleHome"},
 {id:"topIds",title:"Top Collection",help:"Choose products to feature above the main shop catalogue.",shuffle:"shuffleTop"},
 {id:"newIds",title:"New Arrivals",help:"Choose new-arrival designs to feature on the shop page.",shuffle:"shuffleNew"},
];
export function MerchandisingManager({products,initial}:{products:Product[];initial:MerchConfig}){
 const router=useRouter();
 const [config,setConfig]=useState(initial);
 const [search,setSearch]=useState("");
 const [active,setActive]=useState<Group>("homepageIds");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 const catalog=new Map(products.map(p=>[p.id,p]));
 function setGroup(group:Group,ids:string[]){setConfig(old=>({...old,[group]:ids}));}
 function toggle(id:string){
  const selected=config[active];
  if(!selected.includes(id)&&active==="homepageIds"&&selected.length>=6){setError("Homepage can show a maximum of 6 designs.");return;}
  setError("");setGroup(active,selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]);
 }
 function move(group:Group,index:number,delta:number){
  const copy=[...config[group]],target=index+delta;
  if(target<0||target>=copy.length)return;
  [copy[index],copy[target]]=[copy[target],copy[index]];
  setGroup(group,copy);
 }
 async function save(){
  setBusy(true);setError("");setSuccess("");
  try{
   const res=await fetch("/api/admin/merchandising",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)});
   const result=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(result.error||"Could not save collection layout");
   setSuccess("Featured collections saved.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Save failed");}
  finally{setBusy(false);}
 }
 const visible=products.filter(p=>(p.name+" "+p.category).toLowerCase().includes(search.toLowerCase().trim()));
 return <section className="admin-block merch-admin">
  <div className="admin-heading"><div><span className="eyebrow">STOREFRONT CONTROL</span><h2>FEATURED COLLECTIONS</h2></div></div>
  <p>Choose which designs appear on the homepage, Top Collection and New Arrivals. Rearrange manually or enable daily shuffle.</p>
  <div className="merch-tabs" role="group" aria-label="Choose placement">
   {groupInfo.map(g=><button key={g.id} type="button" className={active===g.id?"active":""} onClick={()=>{setActive(g.id);setError("");}}>{g.title} ({config[g.id].length})</button>)}
  </div>
  {groupInfo.filter(g=>g.id===active).map(g=><div key={g.id}>
    <p>{g.help}</p>
    <label className="merch-shuffle"><input type="checkbox" checked={Boolean(config[g.shuffle])} onChange={e=>setConfig(c=>({...c,[g.shuffle]:e.target.checked}))}/> Shuffle this section daily</label>
    <h3>Selected designs and display order</h3>
    {config[g.id].length===0?<p className="muted">No manual selections.</p>:<div className="merch-selected">
     {config[g.id].map((id,i)=><div key={id} className="merch-picked">
      <span>{i+1}. {catalog.get(id)?.name??"Unavailable product"}</span>
      <div><button type="button" disabled={i===0} onClick={()=>move(g.id,i,-1)} aria-label={"Move "+id+" up"}>↑</button><button type="button" disabled={i===config[g.id].length-1} onClick={()=>move(g.id,i,1)} aria-label={"Move "+id+" down"}>↓</button><button type="button" onClick={()=>toggle(id)}>Remove</button></div>
     </div>)}
    </div>}
    <h3>Select active products</h3>
    <input className="merch-search" aria-label="Search products to feature" placeholder="Search product or category" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="merch-products">{visible.map(p=><label key={p.id} className="merch-product">
     <input type="checkbox" checked={config[g.id].includes(p.id)} onChange={()=>toggle(p.id)}/>
     <img src={p.image} alt=""/><span><strong>{p.name}</strong><small>{p.category} · ₹{p.price.toLocaleString("en-IN")}</small></span>
    </label>)}</div>
   </div>)}
  {error&&<p className="error" role="alert">{error}</p>}
  {success&&<p className="admin-notice" role="status">{success}</p>}
  <button className="btn dark" type="button" onClick={()=>void save()} disabled={busy}>{busy?"SAVING...":"SAVE COLLECTION LAYOUT"}</button>
 </section>;
}
