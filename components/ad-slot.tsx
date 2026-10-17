"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}
export function AdSlot(){
 const loaded=useRef(false);
 const client=process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
 const slot=process.env.NEXT_PUBLIC_ADSENSE_SLOT;
 useEffect(()=>{
   if(!client || !slot || loaded.current) return;
   loaded.current=true;
   try { (window.adsbygoogle=window.adsbygoogle||[]).push({}); } catch(e){ console.warn("AdSense unit not initialized",e); }
 },[client,slot]);
 if(!client || !/^ca-pub-\d{16}$/.test(client) || !slot || !/^\d+$/.test(slot))return null;
 return <aside className="ad-space" aria-label="Advertisement">
   <ins className="adsbygoogle" style={{display:"block"}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>
 </aside>;
}
