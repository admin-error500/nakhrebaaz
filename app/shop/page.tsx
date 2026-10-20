import { db } from '@/lib/db';
import Link from 'next/link';
import { ShopSearch } from '@/components/shop-search';
import { loadSale, salePrice } from '@/lib/sale';
import {loadMerchandising,curate} from '@/lib/merchandising';
import {AdSlot} from '@/components/ad-slot';
import {shopBatch,normalizeShopFilters,shopWhere} from '@/lib/shop-catalog';
import {ShopProductList} from '@/components/shop-product-list';

export const dynamic = 'force-dynamic';

type Search = { category?: string; q?: string; type?: string; festival?: string };
const categories = ['Men', 'Women', 'Kids', 'Accessories'];
const types = ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Mugs', 'Magic Mugs', 'Keychains'];
const festivals = ['Diwali', 'Holi', 'Navratri', 'Raksha Bandhan', 'Eid', 'Christmas'];
const photo = {
  men: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=850&q=85',
  women: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=850&q=85',
  kids: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=850&q=85',
};
const url = (category?: string, type?: string) => `/shop?${new URLSearchParams({ ...(category ? { category } : {}), ...(type ? { type } : {}) }).toString()}#shop`;

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const { category, q, type, festival } = await searchParams;
  const selectedFestival = festivals.includes(festival || '') ? festival : undefined;
  const selectedCategory = categories.includes(category || '') ? category : undefined;
  const selectedType = types.includes(type || '') ? type : undefined;
  const filterUrl = (nextCategory?:string,nextType?:string) => {
    const categoryForType=(nextType==='Mugs'||nextType==='Magic Mugs'||nextType==='Keychains')?'Accessories':(nextCategory==='Accessories'&&nextType?undefined:nextCategory);
    return '/shop?' + new URLSearchParams({ ...(categoryForType?{category:categoryForType}:{}), ...(nextType?{type:nextType}:{}), ...(selectedFestival?{festival:selectedFestival}:{}), ...(q?.trim()?{q:q.trim()}:{}), }).toString() + '#shop';
  };
  const [sale,merch]=await Promise.all([loadSale(),loadMerchandising()]);
  const shelfIds=[...new Set([...merch.topIds,...merch.newIds])];
  const shelfProducts=shelfIds.length?await db.product.findMany({
    where:{...shopWhere({category:selectedCategory,type:selectedType,festival:selectedFestival,q}),id:{in:shelfIds}},
    select:{id:true,name:true,image:true,price:true,category:true,festival:true,saleDiscountPercent:true},
  }):[];
  const firstBatch=await shopBatch(normalizeShopFilters({category:selectedCategory,type:selectedType,festival:selectedFestival,q}));
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
        <div className="editorial-heading shop-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>{selectedFestival ? selectedFestival.toUpperCase() : selectedCategory ? selectedCategory==='Accessories'?'ACCESSORIES':`${selectedCategory.toUpperCase()}'S` : 'THE'} <em>COLLECTION.</em></h2><p>Easy fits. Bold prints. A little extra Nakhra.</p></div><ShopSearch q={q || ''} category={selectedCategory} type={selectedType} festival={selectedFestival}/></div>
        <div className="tabs" aria-label="Shop by category">{[['ALL',undefined],['MEN','Men'],['WOMEN','Women'],['KIDS','Kids'],['ACCESSORIES','Accessories']].map(([label,value])=><Link key={label} className={selectedCategory===value?'active':''} href={filterUrl(value,selectedType)}>{label}</Link>)}</div>
        <div className="type-tabs" aria-label="Shop by clothing type">{(selectedCategory==='Accessories'?[['ALL ACCESSORIES',undefined],['MUGS','Mugs'],['MAGIC MUGS','Magic Mugs'],['KEYCHAINS','Keychains']]:[['ALL STYLES',undefined],['T-SHIRTS','T-Shirts'],['HOODIES','Hoodies'],['SWEATSHIRTS','Sweatshirts'],['MUGS','Mugs'],['KEYCHAINS','Keychains']]).map(([label,value])=><Link key={label} className={selectedType===value?'active':''} href={filterUrl(selectedCategory,value)}>{label}</Link>)}</div>
        {selectedFestival && <div className="festival-active"><span>FESTIVAL: {selectedFestival}</span><Link href="/shop">CLEAR FILTER ✕</Link></div>}
        <ShopProductList key={[selectedCategory,selectedType,selectedFestival,q].join("|")} initial={firstBatch.products} nextCursor={firstBatch.nextCursor} filters={{category:selectedCategory,type:selectedType,festival:selectedFestival,q}} />
      </section>
      <AdSlot placement="shop" />
    </main>
  );
}
