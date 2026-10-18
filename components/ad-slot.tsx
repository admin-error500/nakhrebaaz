"use client";
import {useEffect,useRef} from "react";

declare global {interface Window {adsbygoogle?:unknown[];}}
type Placement="home"|"shop"|"product";
export function AdSlot({placement="home"}:{placement?:Placement}){
 const loaded=useRef(false);
 const client=process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
 const configured=placement==="home"?process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME:
  placement==="shop"?process.env.NEXT_PUBLIC_ADSENSE_SLOT_SHOP:
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT;
 const slot=configured||process.env.NEXT_PUBLIC_ADSENSE_SLOT;
 const valid=Boolean(client&&/^ca-pub-\d{16}$/.test(client)&&slot&&/^\d+$/.test(slot));
 useEffect(()=>{
  if(!valid||loaded.current)return;
  loaded.current=true;
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}
  catch(e){console.warn("AdSense slot could not initialize",e);}
 },[valid]);
 // Do not show misleading empty ad boxes before AdSense is configured/approved.
 if(!valid)return null;
 return <aside className={"ad-space ad-placement-"+placement} aria-label="Advertisement">
   <ins className="adsbygoogle" style={{display:"block"}} data-ad-client={client}
    data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>
 </aside>;
}
