import {ProductZoom} from '@/components/product-zoom';
import {SizeChart} from '@/components/size-chart';
import {AdSlot} from '@/components/ad-slot';
import {loadMerchandising,curate} from '@/lib/merchandising';
import Link from 'next/link';
import {loadSale,salePrice} from '@/lib/sale';
export const dynamic = 'force-dynamic';
import {db} from '@/lib/db';import {notFound} from 'next/navigation';import {ProductBuy} from '@/components/product-buy';
export default async function ProductPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const product=await db.product.findUnique({where:{id},include:{variants:true}});if(!product||!product.active)notFound();const [sale,merch]=await Promise.all([loadSale(),loadMerchandising()]);
const recommendedRaw=merch.detailIds.length?
 await db.product.findMany({where:{id:{in:merch.detailIds},active:true}}):[];
const recommendations=curate(recommendedRaw,merch.detailIds,merch.shuffleDetail,8).filter(p=>p.id!==id);
const discount=sale.live?(product.saleDiscountPercent??0):0;const shownPrice=salePrice(product.price,discount,sale.live);return <main className="section detail premium-detail"><ProductZoom src={product.image} alt={product.name}/><div><div className="eyebrow">NAKHREBAAZ / {product.category.toUpperCase()}</div><h1>{product.name}</h1><h2 className="sale-detail-price">{discount>0&&<del>₹{product.price.toLocaleString('en-IN')}</del>} ₹{shownPrice.toLocaleString('en-IN')} {discount>0&&<span className="sale-detail-badge">{discount}% OFF</span>}</h2><p>{product.description}</p><p className="muted">Inclusive of applicable taxes. Shipping calculated at checkout.</p><ProductBuy product={{id:product.id,name:product.name,category:product.category,price:shownPrice,image:product.image,variants:product.variants.map(v=>({id:v.id,size:v.size,color:v.color,stock:v.stock}))}}/>{product.category!=="Mugs"&&product.category!=="Keychains"&&<SizeChart productName={product.name}/>}</div>{recommendations.length>0&&<section className="detail-related-products" aria-label="Recommended designs">
 <div className="editorial-heading"><div><span className="eyebrow">CURATED BY NAKHREBAAZ</span><h2>YOU MAY ALSO <em>LIKE.</em></h2></div></div>
 <div className="products">{recommendations.map(p=><Link href={`/product/${p.id}`} className="product" key={p.id}>
 <div className="product-img"><img src={p.image} alt={p.name} loading="lazy"/></div>
 <div className="product-line"><b>{p.name}</b><strong>₹{salePrice(p.price,p.saleDiscountPercent??0,sale.live).toLocaleString('en-IN')}</strong></div>
 <small>{p.category.toUpperCase()}</small></Link>)}</div>
 </section>}
 <div className="detail-ad-placement"><AdSlot placement="product"/></div></main>}
