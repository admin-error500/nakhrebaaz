"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items=[
 {href:"/admin",label:"Overview",icon:"▦"},
 {href:"/admin/orders",label:"Orders",icon:"▤"},
 {href:"/admin/inventory",label:"Inventory",icon:"▧"},
 {href:"/admin/sales",label:"Sale Management",icon:"%"},
 {href:"/admin/collections",label:"Featured Collections",icon:"✳"},
 {href:"/admin/products/new",label:"Add Product",icon:"+"},
 {href:"/admin/images",label:"Image Generator",icon:"▣"},
] as const;
export function AdminNavigation(){
 const pathname=usePathname();
 return <nav className="admin-multipage-nav" aria-label="Admin pages">
  {items.map(item=>{
   const current=item.href==="/admin"?pathname==="/admin":
    item.href==="/admin/inventory"?pathname.startsWith("/admin/inventory")||pathname.startsWith("/admin/products/")&&!pathname.endsWith("/new"):
    pathname===item.href;
   return <Link key={item.href} href={item.href} className={current?"active":""} aria-current={current?"page":undefined}>
    <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
   </Link>;
  })}
 </nav>;
}
