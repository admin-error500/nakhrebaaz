import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyOrder } from "@/lib/notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to cancel an order." }, { status: 401 });

  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid order." }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId: user.id },
        include: { items: true },
      });
      if (!order) return { error: "Order not found.", code: 404 } as const;

      if (!CANCELLABLE.has(order.status)) {
        return { error: "Cancellation is not available once an order is packed.", code: 409 } as const;
      }

      // A Razorpay checkout in progress may capture a payment after cancellation.
      // Require reconciliation instead of risking an untracked captured payment.
      if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PENDING" && order.paymentOrderId) {
        return {
          error: "Online payment verification is in progress. Please wait or contact support.",
          code: 409,
        } as const;
      }

      const changed = await tx.order.updateMany({
        where: {
          id: order.id,
          userId: user.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
        data: { status: "CANCELLED" },
      });
      if (changed.count !== 1) throw new Error("Order state changed during cancellation.");

      // Inventory is restored once, in the same transaction as the state update.
      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Paid orders still require a separate actual Razorpay refund operation.
      return { ok: true, status: "CANCELLED", refundRequired: order.paymentStatus === "PAID" } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.code });

    try { await notifyOrder(id, "CANCELLED"); }
    catch (notificationError) { console.error("Cancellation notification failed", notificationError); }

    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Customer order cancellation failed", error);
    return NextResponse.json({ error: "Unable to cancel the order. Please refresh and try again." }, { status: 409 });
  }
}
