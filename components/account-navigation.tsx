"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Logout} from "@/components/logout";

const pages=[
 {href:"/account/profile",label:"My profile",icon:"person"},
 {href:"/account/orders",label:"My orders",icon:"orders"},
 {href:"/account/addresses",label:"Saved addresses",icon:"location"},
 {href:"/shop",label:"Continue shopping",icon:"shop"},
] as const;
export function AccountNavigation(){
 const pathname=usePathname();
 return <aside className="account-side" aria-label="Account navigation">
  <div className="account-side-title">MY SPACE</div>
  {pages.map(p=>{
   const active=pathname===p.href;
   return <Link key={p.href} href={p.href} className={"account-side-link"+(active?" active":"")} aria-current={active?"page":undefined}>
    {p.icon==="person"?<svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>:null}
    {p.icon==="orders"?<svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 9h8M8 13h6"/></svg>:null}
    {p.icon==="location"?<svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>:null}
    {p.icon==="shop"?<svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M5 19 19 5M8 5h11v11"/></svg>:null}
    <span>{p.label}</span>
   </Link>;
  })}
  <div className="account-logout"><Logout/></div>
 </aside>;
}
