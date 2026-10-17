const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const db=new PrismaClient();async function main(){const catalog=[['Nakhra Mode ON Tee','Men',799,'photo-1503342217505-b0a15ec3261c'],['Unbothered Oversized Tee','Women',899,'photo-1529139574466-a303027c1d8b'],['Little Rebel Tee','Kids',599,'photo-1519457431-44ccd64a579b'],['Midnight Statement Hoodie','Men',1699,'photo-1556821840-3a63f95609a7'],['Everyday Cool Hoodie','Women',1799,'photo-1578681994506-b8f463449011'],['Mini Icon Hoodie','Kids',1299,'photo-1503919005314-30d93d07d823'],['Bold Type Tee','Men',749,'photo-1506794778202-cad84cf45f1d'],['Weekend Vibes Tee','Women',849,'photo-1483985988355-763728e1935b']];for(let n=0;n<catalog.length;n++){const [name,category,price,photo]=catalog[n];const id=(n+1).toString(16).padStart(24,'0');await db.product.upsert({where:{id},update:{},create:{id,name,category,price,description:'Comfortable everyday streetwear with a statement-making attitude. Sample product: replace photography and product copy before launch.',image:`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`,variants:{create:['S','M','L','XL'].map(size=>({size,color:n%2?'Cream':'Black',stock:20,sku:`NB-${n+1}-${size}`}))}}});}const extra = [
 ['Street Rebel T-Shirt','Men',849,'photo-1503342217505-b0a15ec3261c'],
 ['Own Your Nakhra T-Shirt','Women',849,'photo-1529139574466-a303027c1d8b'],
 ['Mini Nakhrebaaz T-Shirt','Kids',649,'photo-1519457431-44ccd64a579b'],
 ['Street Icon Hoodie','Men',1799,'photo-1556821840-3a63f95609a7'],
 ['Nakhra Queen Hoodie','Women',1899,'photo-1578681994506-b8f463449011'],
 ['Little Star Hoodie','Kids',1399,'photo-1503919005314-30d93d07d823'],
 ['Weekend Mood Sweatshirt','Men',1299,'photo-1576566588028-4147f3842f27'],
 ['Classic Street Sweatshirt','Men',1399,'photo-1576566588028-4147f3842f27'],
 ['Cozy Vibes Sweatshirt','Women',1399,'photo-1554568218-0f1715e72254'],
 ['Bold & Cozy Sweatshirt','Women',1499,'photo-1554568218-0f1715e72254'],
 ['Happy Vibes Sweatshirt','Kids',999,'photo-1519238263530-99bdd11df2ea'],
 ['Little Champ Sweatshirt','Kids',1099,'photo-1519238263530-99bdd11df2ea'],
 ['Nakhra Mode ON T-Shirt','Men',799,'photo-1503342217505-b0a15ec3261c'],
 ['Unbothered T-Shirt','Women',899,'photo-1529139574466-a303027c1d8b'],
 ['Little Rebel T-Shirt','Kids',599,'photo-1519457431-44ccd64a579b'],
 ['Midnight Hoodie','Men',1699,'photo-1556821840-3a63f95609a7'],
 ['Everyday Hoodie','Women',1799,'photo-1578681994506-b8f463449011'],
 ['Mini Icon Hoodie','Kids',1299,'photo-1503919005314-30d93d07'],
 ];
 for(let n=0;n<extra.length;n++){
  const [name,category,price,photo]=extra[n];
  const id=(n+1001).toString(16).padStart(24,'0');
  const sizes=category==='Kids'?['4Y','6Y','8Y','10Y']:['S','M','L','XL'];
  await db.product.upsert({where:{id},update:{},create:{id,name,category,price,active:true,description:'Nakhrebaaz demo streetwear. Replace product imagery, copy, price and stock before launch.',image:`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`,variants:{create:sizes.map(size=>({size,color:n%2?'Cream':'Black',stock:20,sku:`NB-NEW-${n+1001}-${size}`}))}}});
 }
 console.log('Additional demo styles inserted or already present:',extra.length);
 const email=process.env.ADMIN_EMAIL,password=process.env.ADMIN_PASSWORD;if(email&&password){if(password.length<12)throw Error('ADMIN_PASSWORD must be at least 12 characters');await db.user.upsert({where:{email:email.toLowerCase()},update:{},create:{email:email.toLowerCase(),name:'Store Admin',passwordHash:await bcrypt.hash(password,12),role:'ADMIN'}});console.log('Admin created (if not already present).')}console.log('Sample catalog ready');}main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());