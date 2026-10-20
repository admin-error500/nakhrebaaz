import test from "node:test";
import assert from "node:assert/strict";
import {
 CATEGORIES,CLOTHING_TYPES,ACCESSORY_TYPES,FESTIVALS,
 normalizeShopFilters,categoryHref,typeHref,searchHref,shopQueryParams,shopWhere,
} from "../lib/shop-filters.mjs";

const read=(href)=>{
 const url=new URL(href,"https://nakhrebaaz.test");
 assert.equal(url.pathname,"/shop");
 assert.equal(url.hash,"#shop");
 return Object.fromEntries(url.searchParams);
};
test("all category tabs remove incompatible types and stale search",()=>{
 const categories=[undefined,...CATEGORIES];
 for(const from of categories)for(const to of categories){
  const previous={category:from,type:from==="Accessories"?"Mugs":"T-Shirts",q:"na khra"};
  const params=read(categoryHref(previous,to));
  assert.equal(params.category,to);
  assert.equal(params.type,undefined);
  assert.equal(params.q,undefined);
 }
});
test("type buttons work when crossing Accessories and apparel",()=>{
 for(const from of [undefined,...CATEGORIES])
  for(const type of [...CLOTHING_TYPES,...ACCESSORY_TYPES]){
   const params=read(typeHref({category:from,type:from==="Accessories"?"Caps":"Hoodies"},type));
   assert.equal(params.type,type);
   assert.equal(params.category,ACCESSORY_TYPES.includes(type)?"Accessories":from==="Accessories"?undefined:from);
  }
});
test("All Accessories, All Styles and Shop All clear type",()=>{
 assert.deepEqual(read(typeHref({category:"Accessories",type:"Mugs"})),{category:"Accessories"});
 assert.deepEqual(read(typeHref({category:"Women",type:"Hoodies"})),{category:"Women"});
 assert.deepEqual(read(categoryHref({category:"Accessories",type:"Caps"})),{});
});
test("explicit festival filters persist across category/type navigation",()=>{
 assert.deepEqual(read(categoryHref({category:"Accessories",type:"Mugs",festival:"Diwali"},"Men")),
  {category:"Men",festival:"Diwali"});
 assert.deepEqual(read(typeHref({category:"Men",festival:"Holi"},"Caps")),
  {category:"Accessories",type:"Caps",festival:"Holi"});
});
test("global search from any filter resets category, type, festival",()=>{
 for(const category of CATEGORIES){
  const q=read(searchHref("  magic mug  "));
  assert.deepEqual(q,{q:"magic mug"});
  assert.equal(q.category,undefined,category);
 }
 assert.deepEqual(read(searchHref("  ")),{});
 assert.deepEqual(read(searchHref("NAKHRA & LOVE")),{q:"NAKHRA & LOVE"});
});
test("invalid cross-category legacy URLs self-correct",()=>{
 assert.deepEqual(normalizeShopFilters({category:"Accessories",type:"Hoodies"}),{category:"Accessories"});
 assert.deepEqual(normalizeShopFilters({category:"Men",type:"Mugs"}),{category:"Men"});
 assert.deepEqual(normalizeShopFilters({category:"Women",type:"Caps"}),{category:"Women"});
 assert.deepEqual(normalizeShopFilters({category:"Bogus",type:"Caps"}),{type:"Caps"});
 assert.deepEqual(normalizeShopFilters({category:"Accessories",type:"Mugs",festival:"Nope",q:"    "}),
  {category:"Accessories",type:"Mugs"});
});
test("query params and pagination use the same normalized filters",()=>{
 const parsed=Object.fromEntries(shopQueryParams({category:"Accessories",type:"Hoodies",festival:"Diwali",q:" hello  "}));
 assert.deepEqual(parsed,{category:"Accessories",festival:"Diwali",q:"hello"});
});
test("all supported type predicates return correct database category or name conditions",()=>{
 const acc=shopWhere({category:"Accessories",type:"Caps"});
 assert.equal(acc.active,true);
 assert.deepEqual(acc.AND[0],{category:{in:["Mugs","Magic Mugs","Keychains","Caps"]}});
 assert.deepEqual(acc.AND[1],{category:"Caps"});
 const mugs=shopWhere({category:"Accessories",type:"Mugs"});
 assert.deepEqual(mugs.AND[1],{category:{in:["Mugs","Magic Mugs"]}});
 assert.equal(shopWhere({category:"Men",type:"Hoodies"}).AND[0].category,"Men");
 const tees=shopWhere({type:"T-Shirts"});
 assert.deepEqual(tees.AND[0].OR.map(o=>o.name.contains),["T-Shirt","Tshirt","Tee"]);
});
test("search checks product name, description and category, including Accessories aliases",()=>{
 const q=shopWhere({q:"gift"});
 assert.deepEqual(q.AND[0].OR.slice(0,3).map(o=>Object.keys(o)[0]),["name","description","category"]);
 const acc=shopWhere({q:"accessories"});
 assert.deepEqual(acc.AND[0].OR.at(-1).category.in,["Mugs","Magic Mugs","Keychains","Caps"]);
 const magic=shopWhere({q:"magic mug"});
 assert.equal(magic.AND[0].OR.some(o=>o.category==="Magic Mugs"),true);
});
test("normalized search is case-insensitive and keeps festival filtering",()=>{
 const w=shopWhere({q:"  NaKhRa ",festival:"Diwali"});
 assert.equal(w.festival,"Diwali");
 assert.deepEqual(w.AND[0].OR[0],{name:{contains:"NaKhRa",mode:"insensitive"}});
 assert.deepEqual(shopWhere({}),{active:true});
});
