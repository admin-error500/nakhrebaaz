/** One-time demo products. Safe to re-run: existing product/stock is NOT reset. */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const products = [
  { id:'00000000000000000000f101', name:'TEST • Diwali Nakhra Tee', category:'Men', festival:'Diwali', price:399, sku:'NB-STOCK-TEST-DIWALI', image:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85' },
  { id:'00000000000000000000f102', name:'TEST • Holi Color Tee', category:'Women', festival:'Holi', price:449, sku:'NB-STOCK-TEST-HOLI', image:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85' },
  { id:'00000000000000000000f103', name:'TEST • Navratri Rebel Tee', category:'Kids', festival:'Navratri', price:349, sku:'NB-STOCK-TEST-NAVRATRI', image:'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=85' },
];
async function main() {
 for (const p of products) {
   await db.product.upsert({
     where: { id:p.id }, update: {},
     create: { id:p.id, name:p.name, description:'TEST PRODUCT — stock 1. For verifying sold-out after one COD order. Not for real fulfilment.', category:p.category, festival:p.festival, image:p.image, price:p.price, active:true,
       variants:{ create:[{size:'M',color:'Black',stock:1,sku:p.sku}] } },
   });
   const current=await db.product.findUnique({where:{id:p.id},include:{variants:true}});
   console.log(`${p.name}: ${current.variants.map(v=>v.size+'/'+v.color+' stock='+v.stock).join(', ')}`);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
