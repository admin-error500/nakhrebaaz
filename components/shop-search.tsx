"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState,type FormEvent} from "react";
import {searchHref} from "@/lib/shop-filters.mjs";

export function ShopSearch({q}:{q:string}){
 const router=useRouter();
 const [search,setSearch]=useState(q);
 // Sync search input after browser navigation, filters and browser back/forward.
 useEffect(()=>setSearch(q),[q]);
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  // An explicit new search spans all categories; stale filters must not hide results.
  router.push(searchHref(search),{scroll:true});
 }
 function clear(){
  setSearch("");
  router.push("/shop#shop",{scroll:true});
 }
 return <form className="shop-search" onSubmit={submit} role="search">
  <input type="search" name="q" maxLength={80} placeholder="Search all products..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search all products"/>
  {q&&<button type="button" className="shop-search-clear" onClick={clear} aria-label="Clear search">CLEAR</button>}
  <button type="submit">SEARCH ↗</button>
 </form>;
}
