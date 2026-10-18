"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";

export type SavedAddress={
 id:string;tag:string;recipientName:string;phone:string;line1:string;
 line2:string|null;landmark:string|null;city:string;state:string;pincode:string;
 isDefault:boolean;
};
type Draft={
 tag:"HOME"|"OFFICE";recipientName:string;phone:string;line1:string;
 line2:string;landmark:string;city:string;state:string;pincode:string;isDefault:boolean;
};
const blank:Draft={tag:"HOME",recipientName:"",phone:"",line1:"",line2:"",landmark:"",city:"",state:"",pincode:"",isDefault:false};
const fromSaved=(a:SavedAddress):Draft=>({
 tag:a.tag==="OFFICE"?"OFFICE":"HOME",recipientName:a.recipientName,
 phone:a.phone,line1:a.line1,line2:a.line2??"",landmark:a.landmark??"",
 city:a.city,state:a.state,pincode:a.pincode,isDefault:a.isDefault,
});
export function AddressBook({initial}:{initial:SavedAddress[]}){
 const router=useRouter();
 const [addresses,setAddresses]=useState(initial);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [showForm,setShowForm]=useState(false);
 const [draft,setDraft]=useState<Draft>(blank);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 function open(a?:SavedAddress){
  setError("");setNotice("");setShowForm(true);
  setEditingId(a?.id??null);
  setDraft(a?fromSaved(a):{...blank,isDefault:addresses.length===0});
 }
 function change(key:keyof Draft,value:string|boolean){
  setDraft(d=>({...d,[key]:value}));
 }
 async function refresh(){
  const res=await fetch("/api/account/addresses",{cache:"no-store"});
  if(!res.ok)throw new Error("Unable to reload addresses");
  const body=await res.json() as {addresses:SavedAddress[]};
  setAddresses(body.addresses);
  router.refresh();
 }
 async function submit(e:FormEvent){
  e.preventDefault();setError("");setNotice("");setBusy(true);
  try{
   const url=editingId?"/api/account/addresses/"+editingId:"/api/account/addresses";
   const res=await fetch(url,{method:editingId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||"Could not save address");
   await refresh();
   setShowForm(false);setEditingId(null);setNotice("Address saved successfully.");
  }catch(e){setError(e instanceof Error?e.message:"Address could not be saved");}
  finally{setBusy(false);}
 }
 async function remove(a:SavedAddress){
  if(!window.confirm("Delete this "+(a.tag==="OFFICE"?"Office":"Home")+" address?"))return;
  setError("");setNotice("");setBusy(true);
  try{
   const res=await fetch("/api/account/addresses/"+a.id,{method:"DELETE"});
   if(!res.ok){const result=await res.json().catch(()=>({error:"Could not delete address"}));throw new Error(result.error||"Could not delete address");}
   await refresh();setNotice("Address deleted.");
  }catch(e){setError(e instanceof Error?e.message:"Could not delete address");}
  finally{setBusy(false);}
 }
 async function makeDefault(a:SavedAddress){
  setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch("/api/account/addresses/"+a.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...fromSaved(a),isDefault:true})});
   if(!res.ok){const result=await res.json().catch(()=>({error:"Could not select default address"}));throw new Error(result.error||"Could not select default address");}
   await refresh();setNotice("Default address updated.");
  }catch(e){setError(e instanceof Error?e.message:"Could not change default address");}
  finally{setBusy(false);}
 }
 return <section className="account-panel" id="saved-addresses">
  <div className="panel-heading"><div><span className="eyebrow">DELIVERY LOCATIONS</span><h2>SAVED ADDRESSES</h2></div>
   <button type="button" className="account-outline-btn" onClick={()=>open()} disabled={busy||addresses.length>=10}>+ Add Address</button>
  </div>
  <p className="profile-note">Save up to 10 Home / Office addresses. Select one during checkout.</p>
  {notice&&<p className="admin-notice" role="status">{notice}</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="address-book-grid">
   {addresses.length===0&&!showForm&&<p>No saved addresses yet. Add your Home or Office address.</p>}
   {addresses.map(a=><article className="address-card" key={a.id}>
    <div className="address-card-top"><span className="address-tag">{a.tag==="OFFICE"?"Office":"Home"}</span>
     {a.isDefault&&<span className="address-default">Default</span>}</div>
    <strong>{a.recipientName}</strong><p>+91 {a.phone}</p>
    <p>{[a.line1,a.line2,a.landmark,a.city,a.state,a.pincode].filter(Boolean).join(", ")}</p>
    <div className="address-card-actions">
     <button type="button" onClick={()=>open(a)} disabled={busy}>Edit</button>
     {!a.isDefault&&<button type="button" onClick={()=>void makeDefault(a)} disabled={busy}>Set Default</button>}
     <button type="button" onClick={()=>void remove(a)} disabled={busy}>Delete</button>
    </div>
   </article>)}
  </div>
  {showForm&&<form className="account-edit-form account-address-form" onSubmit={submit}>
    <div className="address-form-header"><h3>{editingId?"EDIT ADDRESS":"ADD ADDRESS"}</h3><button type="button" aria-label="Close address form" onClick={()=>{setShowForm(false);setError("");}}>✕</button></div>
    <fieldset className="address-tag-options"><legend>Save As</legend>
      <label><input type="radio" checked={draft.tag==="HOME"} onChange={()=>change("tag","HOME")}/> Home</label>
      <label><input type="radio" checked={draft.tag==="OFFICE"} onChange={()=>change("tag","OFFICE")}/> Office</label>
    </fieldset>
    <div className="address-form-grid">
      <label>Full name<input required minLength={2} maxLength={80} value={draft.recipientName} onChange={e=>change("recipientName",e.target.value)}/></label>
      <label>Phone (+91)<input required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} value={draft.phone} onChange={e=>change("phone",e.target.value.replace(/\D/g,""))}/></label>
      <label className="address-full-row">House / Flat / Street<input required minLength={5} maxLength={200} value={draft.line1} onChange={e=>change("line1",e.target.value)}/></label>
      <label className="address-full-row">Apartment / Area (optional)<input maxLength={160} value={draft.line2} onChange={e=>change("line2",e.target.value)}/></label>
      <label>Landmark (optional)<input maxLength={120} value={draft.landmark} onChange={e=>change("landmark",e.target.value)}/></label>
      <label>City<input required minLength={2} maxLength={80} value={draft.city} onChange={e=>change("city",e.target.value)}/></label>
      <label>State<input required minLength={2} maxLength={80} value={draft.state} onChange={e=>change("state",e.target.value)}/></label>
      <label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={draft.pincode} onChange={e=>change("pincode",e.target.value.replace(/\D/g,""))}/></label>
    </div>
    <label className="address-default-check"><input type="checkbox" checked={draft.isDefault} onChange={e=>change("isDefault",e.target.checked)}/> Set as default delivery address</label>
    {error&&<p className="error" role="alert">{error}</p>}
    <button className="btn dark" disabled={busy}>{busy?"SAVING...":"SAVE ADDRESS"}</button>
  </form>}
 </section>;
}
