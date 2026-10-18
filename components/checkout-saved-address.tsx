"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import type {SavedAddress} from "@/components/address-book";

export function CheckoutSavedAddress({onSelect}:{onSelect:(a:SavedAddress)=>void}){
 const [addresses,setAddresses]=useState<SavedAddress[]>([]);
 const [selected,setSelected]=useState("");
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void (async()=>{
   try{
    const res=await fetch("/api/account/addresses",{cache:"no-store",signal:controller.signal});
    if(!res.ok)return;
    const data=await res.json() as {addresses:SavedAddress[]};
    if(controller.signal.aborted)return;
    setAddresses(data.addresses);
   }catch{}
   finally{if(!controller.signal.aborted)setLoaded(true);}
  })();
  return()=>controller.abort();
 },[]);
 function choose(id:string){
  setSelected(id);
  const a=addresses.find(x=>x.id===id);
  if(a)onSelect(a);
 }
 if(!loaded||addresses.length===0)return null;
 return <div className="checkout-saved-address">
  <div className="checkout-address-header"><strong>Saved delivery addresses</strong><Link href="/account/addresses">Manage</Link></div>
  <p className="profile-note">Select Home or Office to fill shipping details. You can still edit the fields below.</p>
  <div className="checkout-address-options">
   {addresses.map(a=><label key={a.id} className={selected===a.id?"checkout-address-choice selected":"checkout-address-choice"}>
    <input type="radio" name="savedAddressChoice" checked={selected===a.id} onChange={()=>choose(a.id)}/>
    <span><strong>{a.tag==="OFFICE"?"Office":"Home"} {a.isDefault?"· Default":""}</strong>
    <small>{a.recipientName} · {a.line1}, {a.city} · {a.pincode}</small></span>
   </label>)}
  </div>
 </div>;
}
