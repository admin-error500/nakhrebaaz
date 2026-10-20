import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(3, 'Product name must be at least 3 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  category: z.enum(['Men', 'Women', 'Kids', 'Mugs', 'Keychains', 'Caps']),
  festival: z.enum(['Diwali', 'Holi', 'Navratri', 'Raksha Bandhan', 'Eid', 'Christmas']).nullable().optional(),
  image: z.string().url('Please enter a valid image URL'),
  price: z.number().int().min(1, 'Price must be at least ₹1'),
  variants: z.array(z.object({
    size: z.string().trim().min(1, 'Size is required'),
    color: z.string().trim().min(1, 'Color is required'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    sku: z.string().trim().min(3, 'SKU must be at least 3 characters'),
  })).min(1),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const data = schema.parse(await req.json());
    const skus=data.variants.map(v=>v.sku);
    const skuKeys=skus.map(v=>v.toLowerCase());
    if(new Set(skuKeys).size!==skuKeys.length){
      return NextResponse.json({error:'Duplicate SKU in product variants.'},{status:400});
    }
    const colourPairs=data.variants.map(v=>v.size.toLowerCase()+'|'+v.color.toLowerCase());
    if(new Set(colourPairs).size!==colourPairs.length){
      return NextResponse.json({error:'Duplicate size/colour variant.'},{status:400});
    }
    const existing=await db.variant.findFirst({where:{sku:{in:skus}},select:{sku:true}});
    if(existing){
      return NextResponse.json({error:`SKU "${existing.sku}" already exists. Please enter a unique SKU prefix.`},{status:409});
    }
    const product = await db.product.create({
      data: { ...data, festival: data.festival || null, variants: { create: data.variants } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'A product with the same unique value already exists (usually SKU). Please use a different SKU.' }, { status: 409 });
    }
    console.error('Admin product creation failed:', e);
    return NextResponse.json({ error: 'Could not add product. Please check the server logs.' }, { status: 500 });
  }
}

export async function GET() {
  const user = await currentUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  return NextResponse.json(await db.product.findMany({ include: { variants: true } }));
}
