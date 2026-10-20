/**
 * Shared, side-effect-free storefront filter rules.
 * Used by shop links, search, initial database queries and pagination.
 */
export const CATEGORIES=["Men","Women","Kids","Accessories"];
export const CLOTHING_TYPES=["T-Shirts","Hoodies","Sweatshirts"];
export const ACCESSORY_TYPES=["Mugs","Keychains","Caps"];
export const GARMENT_TYPES=[...CLOTHING_TYPES,...ACCESSORY_TYPES];
export const FESTIVALS=["Diwali","Holi","Navratri","Raksha Bandhan","Eid","Christmas"];

const includes=(values,value)=>typeof value==="string"&&values.includes(value);
const isAccessory=(type)=>ACCESSORY_TYPES.includes(type);

export function normalizeShopFilters(raw={}){
 const category=includes(CATEGORIES,raw.category)?raw.category:undefined;
 const candidateType=includes(GARMENT_TYPES,raw.type)?raw.type:undefined;
 const type=category==="Accessories"
   ?(candidateType&&isAccessory(candidateType)?candidateType:undefined)
   :category
     ?(candidateType&&!isAccessory(candidateType)?candidateType:undefined)
     :candidateType;
 const festival=includes(FESTIVALS,raw.festival)?raw.festival:undefined;
 const q=typeof raw.q==="string"?raw.q.trim().slice(0,80):"";
 return {
  ...(category?{category}:{}),
  ...(type?{type}:{}),
  ...(festival?{festival}:{}),
  ...(q?{q}:{}),
 };
}
export function shopQueryParams(filters={}){
 const f=normalizeShopFilters(filters);
 const params=new URLSearchParams();
 if(f.category)params.set("category",f.category);
 if(f.type)params.set("type",f.type);
 if(f.festival)params.set("festival",f.festival);
 if(f.q)params.set("q",f.q);
 return params;
}
export function shopHref(filters={}){
 const query=shopQueryParams(filters).toString();
 return "/shop"+(query?"?"+query:"")+"#shop";
}
/** Category navigation deliberately resets stale type and search text. */
export function categoryHref(current={},nextCategory){
 const f=normalizeShopFilters(current);
 return shopHref({category:nextCategory,festival:f.festival});
}
/** Choosing a type switches its category when needed, never an incompatible pair. */
export function typeHref(current={},nextType){
 const f=normalizeShopFilters(current);
 if(!nextType)return shopHref({category:f.category,festival:f.festival});
 const category=isAccessory(nextType)?"Accessories":f.category==="Accessories"?undefined:f.category;
 return shopHref({category,type:nextType,festival:f.festival});
}
/** Search always looks across all products; filters are applied only when chosen afterwards. */
export function searchHref(text){
 return shopHref({q:text});
}
const contains=(term)=>({contains:term,mode:"insensitive"});
export function shopWhere(raw={}){
 const f=normalizeShopFilters(raw);
 const AND=[];
 if(f.category)AND.push(f.category==="Accessories"
   ?{category:{in:["Mugs","Magic Mugs","Keychains","Caps"]}}
   :{category:f.category});
 if(f.type){
  if(f.type==="Mugs")AND.push({category:{in:["Mugs","Magic Mugs"]}});
  else if(isAccessory(f.type))AND.push({category:f.type});
  else {
   const aliases=f.type==="T-Shirts"?["T-Shirt","Tshirt","Tee"]
    :f.type==="Hoodies"?["Hoodie"]:["Sweatshirt"];
   AND.push({OR:aliases.map(alias=>({name:contains(alias)}))});
  }
 }
 if(f.q){
  const term=f.q.toLowerCase();
  const OR=[
   {name:contains(f.q)},
   {description:contains(f.q)},
   {category:contains(f.q)},
  ];
  if(term==="accessory"||term==="accessories")
   OR.push({category:{in:["Mugs","Magic Mugs","Keychains","Caps"]}});
  if(["t shirt","t shirts","tshirt","tshirts","tee","tees"].includes(term))
   OR.push({name:contains("T-Shirt")},{name:contains("Tee")});
  if(term==="magic mug"||term==="magic mugs")
   OR.push({category:"Magic Mugs"},{name:contains("Magic Mug")});
  AND.push({OR});
 }
 return {active:true,...(f.festival?{festival:f.festival}:{}),...(AND.length?{AND}:{})};
}
