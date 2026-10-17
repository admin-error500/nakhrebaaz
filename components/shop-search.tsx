"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ShopSearch({q,category,type,festival}:{q:string;category?:string;type?:string;festival?:string}){
 const router=useRouter();
 const [search,setSearch]=useState(q);
 function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();
   const params=new URLSearchParams();
   if(category) params.set("category",category);
   if(type) params.set("type",type);
   if(festival) params.set("festival",festival);
   if(search.trim()) params.set("q",search.trim());
   router.push(`/${params.size?"?"+params.toString():""}#shop`,{scroll:true});
 }
 return <form className="shop-search" onSubmit={submit} role="search">
   <input name="q" placeholder="Search styles..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search products"/>
   <button type="submit">SEARCH ↗</button>
 </form>;
}
