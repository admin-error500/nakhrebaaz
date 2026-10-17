import { db } from '@/lib/db';
import Link from 'next/link';
import { ShopSearch } from '@/components/shop-search';
import { AdSlot } from '@/components/ad-slot';
import { loadSale, salePrice } from '@/lib/sale';

export const dynamic = 'force-dynamic';

type Search = { category?: string; q?: string; type?: string; festival?: string };
const categories = ['Men', 'Women', 'Kids'];
const types = ['T-Shirts', 'Hoodies', 'Sweatshirts'];
const festivals = ['Diwali', 'Holi', 'Navratri', 'Raksha Bandhan', 'Eid', 'Christmas'];
const photo = {
  men: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=850&q=85',
  women: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=850&q=85',
  kids: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=850&q=85',
};
const url = (category?: string, type?: string) => `/?${new URLSearchParams({ ...(category ? { category } : {}), ...(type ? { type } : {}) }).toString()}#shop`;

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const { category, q, type, festival } = await searchParams;
  const selectedFestival = festivals.includes(festival || '') ? festival : undefined;
  const selectedCategory = categories.includes(category || '') ? category : undefined;
  const selectedType = types.includes(type || '') ? type : undefined;
  const filterUrl = (nextCategory?:string,nextType?:string) => '/?' + new URLSearchParams({ ...(nextCategory?{category:nextCategory}:{}), ...(nextType?{type:nextType}:{}), ...(selectedFestival?{festival:selectedFestival}:{}), ...(q?.trim()?{q:q.trim()}:{}), }).toString() + '#shop';
  const sale = await loadSale();
  const products = await db.product.findMany({
    where: {
      active: true,
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(selectedFestival ? { festival: selectedFestival } : {}),
      ...(selectedType ? { name: { contains: selectedType === 'T-Shirts' ? 'T-Shirt' : selectedType === 'Hoodies' ? 'Hoodie' : 'Sweatshirt', mode: 'insensitive' as const } } : {}),
      ...(q?.trim() ? { AND: [{ name: { contains: q.trim(), mode: 'insensitive' as const } }] } : {}),
    },
    include: { variants: true },
    orderBy: { createdAt: 'desc' },
  });
  return (
    <main>
      {sale.live && <section className="sale-hero-banner" aria-label="Current sale">
        {sale.settings.imageUrl && <img src={sale.settings.imageUrl} alt="" className="sale-banner-background" />}
        <div className="sale-hero-copy"><span className="eyebrow">LIMITED TIME · SELECTED STYLES</span><h2>{sale.settings.title}</h2><p>{sale.settings.subtitle}</p><Link className="btn dark" href={sale.settings.buttonUrl}>{sale.settings.buttonText} ↗</Link></div>
      </section>}
      <section className="hero hero-redesign">
        <div className="hero-copy">
          <div className="hero-stamp">THE NAKHRA CLUB · EST. 2026</div>
          <div className="hero-kicker">LOUD FITS. BIG MOODS.</div>
          <h1>WEAR<br/>YOUR <em>NAKHRA.</em></h1>
          <p>Graphic tees, cozy hoodies and statement sweatshirts for people who never do boring.</p>
          <Link className="btn dark hero-button" href="/#shop">SHOP THE DROP <span>↗</span></Link>
          <div className="hero-note">YOUR STYLE. YOUR RULES. ✳</div>
        </div>
        <div className="hero-photo"><img src={photo.women} alt="Streetwear fashion inspiration"/><span className="hero-photo-tag">THE EVERYDAY REBEL ✳</span></div>
        <div className="hero-side-word">100% NAKHRA</div>
      </section>
      <div className="marquee-strip"><span>✳ MADE TO STAND OUT</span><span>✳ FITS FOR EVERY MOOD</span><span>✳ UNAPOLOGETICALLY YOU</span><span>✳ MADE TO STAND OUT</span></div>
      <section className="category-section">
        <div className="editorial-heading"><div><span className="eyebrow">FIND YOUR VIBE</span><h2>SHOP BY <em>YOU.</em></h2></div><p>Different moods. Same attitude.</p></div>
        <div className="category-grid">
          {[{name:'MEN',image:photo.men,tag:'THE BOLD EDIT',cat:'Men'}, {name:'WOMEN',image:photo.women,tag:'THE MAIN CHARACTER EDIT',cat:'Women'}, {name:'KIDS',image:photo.kids,tag:'THE LITTLE REBELS',cat:'Kids'}].map(c=><Link key={c.cat} className="category-tile" href={url(c.cat)}><img src={c.image} alt={`${c.cat} fashion`}/><div className="category-shade"/><span className="category-tag">{c.tag}</span><div className="category-label"><strong>{c.name}</strong><span>SHOP NOW ↗</span></div></Link>)}
        </div>
      </section>
      <section className="festival-section" id="festivals">
        <div className="editorial-heading"><div><span className="eyebrow">CELEBRATE IN STYLE</span><h2>SHOP BY <em>FESTIVAL.</em></h2></div><p>Festive prints. Maximum nakhra.</p></div>
        <div className="festival-grid">{festivals.map((f, i) => <Link key={f} className={`festival-tile festival-${i}`} href={`/?festival=${encodeURIComponent(f)}#shop`}><span className="festival-symbol">{['🪔','🎨','💃','🎁','🌙','🎄'][i]}</span><strong>{f.toUpperCase()}</strong><span>EXPLORE COLLECTION ↗</span></Link>)}</div>
      </section>
      <section className="promo-ribbon"><div><span>✳ FRESH DROP</span><h2>GOOD CLOTHES.<br/>BAD ATTITUDE.</h2></div><Link href="/#shop">FIND YOUR FIT ↗</Link></section>
      <section className="section shop-section" id="shop">
        <div className="editorial-heading shop-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>{selectedFestival ? selectedFestival.toUpperCase() : selectedCategory ? `${selectedCategory.toUpperCase()}'S` : 'THE'} <em>COLLECTION.</em></h2><p>Easy fits. Bold prints. A little extra Nakhra.</p></div><ShopSearch q={q || ''} category={selectedCategory} type={selectedType} festival={selectedFestival}/></div>
        <div className="tabs" aria-label="Shop by category">{[['ALL',undefined],['MEN','Men'],['WOMEN','Women'],['KIDS','Kids']].map(([label,value])=><Link key={label} className={selectedCategory===value?'active':''} href={filterUrl(value,selectedType)}>{label}</Link>)}</div>
        <div className="type-tabs" aria-label="Shop by clothing type">{[['ALL STYLES',undefined],['T-SHIRTS','T-Shirts'],['HOODIES','Hoodies'],['SWEATSHIRTS','Sweatshirts']].map(([label,value])=><Link key={label} className={selectedType===value?'active':''} href={filterUrl(selectedCategory,value)}>{label}</Link>)}</div>
        {selectedFestival && <div className="festival-active"><span>FESTIVAL: {selectedFestival}</span><Link href="/#shop">CLEAR FILTER ✕</Link></div>}
        <div className="product-meta"><span>{products.length} STYLES TO LOVE</span><span>✳ NEW ARRIVALS</span></div>
        <div className="products" id="filtered-products">{products.map((p,i)=><Link href={`/product/${p.id}`} className="product" key={p.id}><div className="product-img"><img src={p.image} alt={p.name} loading={i<4?'eager':'lazy'}/><span className="pill">{p.variants.every(v => v.stock === 0) ? 'SOLD OUT' : sale.live && (p.saleDiscountPercent??0)>0 ? `${p.saleDiscountPercent}% OFF` : p.festival || (i%3===0?'BESTSELLER':'NEW DROP')}</span><span className="product-arrow">↗</span></div><div className="product-line"><b>{p.name}</b><span className="sale-price-pair">{sale.live && (p.saleDiscountPercent??0)>0 && <del>₹{p.price.toLocaleString('en-IN')}</del>}<strong>₹{salePrice(p.price,p.saleDiscountPercent??0,sale.live).toLocaleString('en-IN')}</strong></span></div><small>{p.category.toUpperCase()} · {p.variants.every(v => v.stock === 0) ? 'OUT OF STOCK' : `${p.variants.length} OPTIONS`}</small></Link>)}</div>
        {products.length===0&&<div className="empty-products"><h3>No styles found yet.</h3><p>Try another category or add demo products using <code>node prisma/seed.cjs</code>.</p><Link className="btn dark" href="/#shop">VIEW ALL STYLES</Link></div>}
      </section>
      <AdSlot />
      <section className="bottom-banner"><span>THE NAKHREBAAZ MANIFESTO</span><h2>TOO MUCH<br/><em>PERSONALITY?</em><br/>NEVER.</h2><p>For every mood that refuses to blend in.</p><Link className="btn dark" href="/#shop">EXPLORE THE COLLECTION ↗</Link></section>
    </main>
  );
}
