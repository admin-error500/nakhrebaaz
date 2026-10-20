import { db } from '@/lib/db';
import Link from 'next/link';
import { ShopSearch } from '@/components/shop-search';
import { AdSlot } from '@/components/ad-slot';
import { loadSale, salePrice } from '@/lib/sale';
import {loadMerchandising,curate} from '@/lib/merchandising';
import {redirect} from 'next/navigation';
import {FeaturedSlider} from '@/components/featured-slider';

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
  const filterUrl = (nextCategory?:string,nextType?:string) => '/?' + new URLSearchParams({ ...(nextCategory?{category:nextCategory}:{}), ...(nextType?{type:nextType}:{}), ...(selectedFestival?{festival:selectedFestival}:{}), ...(q?.trim()?{q:q.trim()}:{}), }).toString() + '#shop';
  // Keep existing bookmarked homepage filters working by forwarding them to the full shop page.
  if(selectedCategory||selectedType||selectedFestival||q?.trim()){
    const params=new URLSearchParams();
    if(selectedCategory)params.set('category',selectedCategory);
    if(selectedType)params.set('type',selectedType);
    if(selectedFestival)params.set('festival',selectedFestival);
    if(q?.trim())params.set('q',q.trim());
    redirect('/shop?'+params.toString()+'#shop');
  }
  const [sale,merch]=await Promise.all([loadSale(),loadMerchandising()]);
  const products = await db.product.findMany({
    where:{active:true,...(merch.homepageIds.length?{id:{in:merch.homepageIds}}:{})},
    include:{variants:true},
    orderBy:{createdAt:"desc"},
    ...(!merch.homepageIds.length?{take:6}:{}),
  });
  const homeProducts=curate(products,merch.homepageIds,merch.shuffleHome,6);
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
          <p>Graphic tees, cozy hoodies, mugs and keychains for people who never do boring.</p>
          <Link className="btn dark hero-button" href="/shop">SHOP THE DROP <span>↗</span></Link>
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
      <section className="accessories-section" aria-labelledby="accessories-title">
        <div className="editorial-heading"><div><span className="eyebrow">NAKHRA BEYOND THE OUTFIT</span><h2 id="accessories-title">EVERYDAY <em>NAKHRA.</em></h2></div><p>Same attitude. More ways to show it.</p></div>
        <div className="accessories-grid">
          <Link className="accessory-tile" href="/shop?category=Accessories&type=Mugs#shop">
            <span className="accessory-copy"><span className="accessory-kicker">SIP WITH ATTITUDE</span><strong>NAKHRA MUGS</strong><span className="accessory-cta">SEE MORE ↗</span></span>
            <span className="accessory-symbol" aria-hidden="true">☕</span>
          </Link>
          <Link className="accessory-tile" href="/shop?category=Accessories&type=Magic+Mugs#shop">
            <span className="accessory-copy"><span className="accessory-kicker">WATCH YOUR NAKHRA APPEAR</span><strong>MAGIC MUGS</strong><span className="accessory-cta">SEE MORE ↗</span></span>
            <span className="accessory-symbol" aria-hidden="true">✨</span>
          </Link>
          <Link className="accessory-tile" href="/shop?category=Accessories&type=Keychains#shop">
            <span className="accessory-copy"><span className="accessory-kicker">TAKE IT EVERYWHERE</span><strong>NAKHRA KEYCHAINS</strong><span className="accessory-cta">SEE MORE ↗</span></span>
            <span className="accessory-symbol" aria-hidden="true">🔑</span>
          </Link>
        </div>
      </section>
      <section className="festival-section" id="festivals">
        <div className="editorial-heading"><div><span className="eyebrow">CELEBRATE IN STYLE</span><h2>SHOP BY <em>FESTIVAL.</em></h2></div><p>Festive prints. Maximum nakhra.</p></div>
        <div className="festival-grid">{festivals.map((f, i) => <Link key={f} className={`festival-tile festival-${i}`} href={`/shop?festival=${encodeURIComponent(f)}#shop`}><span className="festival-symbol">{['🪔','🎨','💃','🎁','🌙','🎄'][i]}</span><strong>{f.toUpperCase()}</strong><span>EXPLORE COLLECTION ↗</span></Link>)}</div>
      </section>
      <section className="promo-ribbon"><div><span>✳ FRESH DROP</span><h2>GOOD CLOTHES.<br/>BAD ATTITUDE.</h2></div><Link href="/shop">FIND YOUR FIT ↗</Link></section>
      <section className="section shop-section home-featured-section" id="shop">
        <div className="editorial-heading shop-heading">
          <div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>FEATURED <em>DESIGNS.</em></h2><p>Just a taste of NakhreBaaz. Explore every style in the full shop.</p></div>
          <Link className="btn dark" href="/shop">SEE MORE</Link>
        </div>
        <FeaturedSlider products={homeProducts.map(p=>({
          id:p.id,name:p.name,description:p.description,image:p.image,category:p.category,
          originalPrice:p.price,price:salePrice(p.price,p.saleDiscountPercent??0,sale.live),
          discountPercent:sale.live?(p.saleDiscountPercent??0):0,
          stock:p.variants.reduce((sum,v)=>sum+v.stock,0),variantCount:p.variants.length,
        }))}/>
        <div className="home-shop-more"><Link className="btn dark" href="/shop">SEE MORE</Link></div>
      </section>
      <AdSlot />
      <section className="bottom-banner"><span>THE NAKHREBAAZ MANIFESTO</span><h2>TOO MUCH<br/><em>PERSONALITY?</em><br/>NEVER.</h2><p>For every mood that refuses to blend in.</p><Link className="btn dark" href="/shop">SEE MORE</Link></section>
    </main>
  );
}
