import {notifyOrder} from "@/lib/notifications";
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('STATUS'), id: z.string().regex(/^[a-f0-9]{24}$/i), status: z.enum(['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) }),
  z.object({ action: z.literal('COD_RECEIVED'), id: z.string().regex(/^[a-f0-9]{24}$/i) }),
]);
const next: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
export async function GET() {
  const user = await currentUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const orders = await db.order.findMany({ include: { user: { select: { name: true, email: true } }, items: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(orders);
}
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order or status' }, { status: 400 });
  const { id } = parsed.data;
  if (parsed.data.action === 'COD_RECEIVED') {
    try {
      const result = await db.order.updateMany({
        where: { id, paymentMethod: 'COD', status: 'DELIVERED', paymentStatus: 'PENDING' },
        data: { paymentStatus: 'PAID' },
      });
      if (result.count !== 1) return NextResponse.json({ error: 'COD payment already recorded, or order is not delivered.' }, { status: 409 });
      await notifyOrder(id,'COD_RECEIVED');
      return NextResponse.json({ ok: true, paymentStatus: 'PAID' });
    } catch { return NextResponse.json({ error: 'Could not record COD payment' }, { status: 500 }); }
  }
  const { status } = parsed.data;
  try {
    const updated = await db.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('Order not found');
      if (!(next[order.status] ?? []).includes(status)) throw new Error('This status transition is not allowed');
      if (status !== 'CANCELLED' && order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') throw new Error('Online payment is not verified');
      // Conditional write prevents a second admin from processing the same state twice.
      const change = await tx.order.updateMany({ where: { id, status: order.status }, data: { status } });
      if (change.count !== 1) throw new Error('Order was updated elsewhere. Refresh and retry');
      if (status === 'CANCELLED') {
        for (const item of order.items) {
          await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        // Do not mark paid orders as refunded. A real refund is a separate Razorpay operation.
      }
      return { id, status, refundRequired: status === 'CANCELLED' && order.paymentStatus === 'PAID' };
    });
    await notifyOrder(id,status);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to update order' }, { status: 409 });
  }
}
