import { db } from '@/lib/db';
import Link from 'next/link';
import { ShopSearch } from '@/components/shop-search';
import { loadSale, salePrice } from '@/lib/sale';
import {loadMerchandising,curate} from '@/lib/merchandising';
import {AdSlot} from '@/components/ad-slot';
import {shopBatch,shopWhere} from '@/lib/shop-catalog';
import {normalizeShopFilters,categoryHref,typeHref} from '@/lib/shop-filters.mjs';
import {ShopProductList} from '@/components/shop-product-list';

export const dynamic = 'force-dynamic';
type Search = { category?:string; q?:string; type?:string; festival?:string };

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const filters=normalizeShopFilters(await searchParams);
  const {category:selectedCategory,type:selectedType,festival:selectedFestival,q}=filters;
  const filterUrl=(nextCategory?:string)=>categoryHref(filters,nextCategory);
  const typeUrl=(nextType?:string)=>typeHref(filters,nextType);
  const [sale,merch]=await Promise.all([loadSale(),loadMerchandising()]);
  const shelfIds=[...new Set([...merch.topIds,...merch.newIds])];
  const shelfProducts=shelfIds.length?await db.product.findMany({
    where:{...shopWhere({category:selectedCategory,type:selectedType,festival:selectedFestival,q}),id:{in:shelfIds}},
    select:{id:true,name:true,description:true,image:true,price:true,category:true,festival:true,saleDiscountPercent:true},
  }):[];
  const firstBatch=await shopBatch(filters);
  const curatedTop=curate(shelfProducts,merch.topIds,merch.shuffleTop).filter(p=>merch.topIds.includes(p.id)).slice(0,8);
  const curatedNew=curate(shelfProducts,merch.newIds,merch.shuffleNew).filter(p=>merch.newIds.includes(p.id)).slice(0,8);
  return (
    <main className="shop-catalogue-page">
      {curatedTop.length>0 && <section className="section storefront-shelf" aria-label="Top collection">
        <div className="editorial-heading"><div><span className="eyebrow">HANDPICKED</span><h2>TOP <em>COLLECTION.</em></h2></div></div>
        <div className="products">{curatedTop.map(p=><Link href={`/product/${p.id}`} className="product" key={p.id}><div className="product-img"><img src={p.image} alt={p.name} loading="lazy"/></div><div className="product-line"><b>{p.name}</b><strong>₹{salePrice(p.price,p.saleDiscountPercent??0,sale.live).toLocaleString('en-IN')}</strong></div><small>{p.category.toUpperCase()}</small></Link>)}</div>
      </section>}
      {curatedNew.length>0 && <section className="section storefront-shelf" aria-label="New arrivals">
        <div className="editorial-heading"><div><span className="eyebrow">JUST LANDED</span><h2>NEW <em>ARRIVALS.</em></h2></div></div>
        <div className="products">{curatedNew.map(p=><Link href={`/product/${p.id}`} className="product" key={p.id}><div className="product-img"><img src={p.image} alt={p.name} loading="lazy"/></div><div className="product-line"><b>{p.name}</b><strong>₹{salePrice(p.price,p.saleDiscountPercent??0,sale.live).toLocaleString('en-IN')}</strong></div><small>{p.category.toUpperCase()}</small></Link>)}</div>
      </section>}
      <section className="section shop-section" id="shop">
        <div className="editorial-heading shop-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>{selectedFestival ? selectedFestival.toUpperCase() : selectedCategory ? selectedCategory==='Accessories'?'ACCESSORIES':`${selectedCategory.toUpperCase()}'S` : 'THE'} <em>COLLECTION.</em></h2><p>Easy fits. Bold prints. A little extra Nakhra.</p></div><ShopSearch q={q || ''}/></div>
        <div className="tabs" aria-label="Shop by category">{[['ALL',undefined],['MEN','Men'],['WOMEN','Women'],['KIDS','Kids'],['ACCESSORIES','Accessories']].map(([label,value])=><Link key={label} className={selectedCategory===value?'active':''} href={filterUrl(value)}>{label}</Link>)}</div>
        <div className="type-tabs" aria-label="Shop by clothing type">{(selectedCategory==='Accessories'?[['ALL ACCESSORIES',undefined],['MUGS','Mugs'],['KEYCHAINS','Keychains'],['CAPS','Caps']]:[['ALL STYLES',undefined],['T-SHIRTS','T-Shirts'],['HOODIES','Hoodies'],['SWEATSHIRTS','Sweatshirts'],['MUGS','Mugs'],['KEYCHAINS','Keychains'],['CAPS','Caps']]).map(([label,value])=><Link key={label} className={selectedType===value?'active':''} href={typeUrl(value)}>{label}</Link>)}</div>
        {(selectedCategory||selectedType||selectedFestival||q)&&<div className="festival-active"><span>{q?"SEARCH: "+q:"FILTERS APPLIED"}</span><Link href="/shop#shop">CLEAR ALL FILTERS ✕</Link></div>}
        {selectedFestival && <div className="festival-active"><span>FESTIVAL: {selectedFestival}</span><Link href="/shop">CLEAR FILTER ✕</Link></div>}
        <ShopProductList key={[selectedCategory,selectedType,selectedFestival,q].join("|")} initial={firstBatch.products} nextCursor={firstBatch.nextCursor} filters={{category:selectedCategory,type:selectedType,festival:selectedFestival,q}} />
      </section>
      <AdSlot placement="shop" />
    </main>
  );
}
