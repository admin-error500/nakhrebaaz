import {db} from '@/lib/db';
import {loadSale,salePrice} from '@/lib/sale';
import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){
 const sale=await loadSale();
 const products=await db.product.findMany({where:{active:true},include:{variants:true}});
 return NextResponse.json(products.map(p=>({...p,price:salePrice(p.price,p.saleDiscountPercent??0,sale.live),originalPrice:p.price,discountPercent:sale.live?(p.saleDiscountPercent??0):0})));
}