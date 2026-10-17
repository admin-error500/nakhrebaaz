
import { notifyOrder } from "@/lib/notifications";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment verification not configured" },
      { status: 503 }
    );
  }

  try {
    // 1. Validate request
    const data = schema.parse(await req.json());

    // 2. Verify Razorpay signature
    const digest = createHmac("sha256", keySecret)
      .update(
        `${data.razorpay_order_id}|${data.razorpay_payment_id}`
      )
      .digest("hex");

    const expected = Buffer.from(digest, "hex");

    const received = Buffer.from(
      data.razorpay_signature,
      "hex"
    );

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 3. Find the checkout's anchor order
    const anchor = await db.order.findUnique({
      where: {
        id: data.orderId,
      },
    });

    if (
      !anchor ||
      anchor.userId !== user.id ||
      anchor.paymentMethod !== "ONLINE" ||
      anchor.paymentOrderId !== data.razorpay_order_id
    ) {
      return NextResponse.json(
        { error: "Order mismatch" },
        { status: 400 }
      );
    }

    // 4. Build a correctly typed Prisma filter
    const orderWhere: Prisma.OrderWhereInput =
      anchor.checkoutId
        ? {
            checkoutId: anchor.checkoutId,
          }
        : {
            id: anchor.id,
          };

    // 5. Fetch all product-wise orders
    const orders = await db.order.findMany({
      where: orderWhere,
    });

    if (
      orders.length === 0 ||
      orders.some(
        (order) =>
          order.userId !== user.id ||
          order.paymentMethod !== "ONLINE" ||
          order.paymentOrderId !== data.razorpay_order_id ||
          order.status === "CANCELLED"
      )
    ) {
      return NextResponse.json(
        { error: "Checkout mismatch or cancelled" },
        { status: 400 }
      );
    }

    // 6. Verify captured payment directly with Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const payment = await razorpay.payments.fetch(
      data.razorpay_payment_id
    );

    const expectedAmount = orders.reduce(
      (sum, order) => sum + order.total * 100,
      0
    );

    if (
      payment.order_id !== data.razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      Number(payment.amount) !== expectedAmount
    ) {
      return NextResponse.json(
        {
          error: "Payment not captured or amount mismatch",
        },
        { status: 400 }
      );
    }

    // 7. Mark all product orders as paid atomically
    const newlyPaidIds = await db.$transaction(
      async (tx) => {
        const latest = await tx.order.findMany({
          where: orderWhere,
        });

        if (
          latest.length !== orders.length ||
          latest.some(
            (order) =>
              order.userId !== user.id ||
              order.paymentMethod !== "ONLINE" ||
              order.paymentOrderId !== data.razorpay_order_id ||
              order.status === "CANCELLED" ||
              (order.paymentStatus === "PAID" &&
                order.paymentId !== data.razorpay_payment_id) ||
              !["PENDING", "PAID"].includes(order.paymentStatus)
          )
        ) {
          throw new Error("Checkout state changed");
        }

        const pendingOrders = latest.filter(
          (order) => order.paymentStatus === "PENDING"
        );

        for (const order of pendingOrders) {
          const result = await tx.order.updateMany({
            where: {
              id: order.id,
              status: {
                not: "CANCELLED",
              },
              paymentStatus: "PENDING",
              paymentOrderId: data.razorpay_order_id,
            },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              paymentId: data.razorpay_payment_id,
            },
          });

          if (result.count !== 1) {
            throw new Error(
              "Concurrent payment update detected"
            );
          }
        }

        return pendingOrders.map((order) => order.id);
      }
    );

    // 8. Notify only newly paid orders
    for (const orderId of newlyPaidIds) {
      try {
        await notifyOrder(orderId, "PAYMENT_PAID");
      } catch (notificationError) {
        console.error(
          "Payment notification failed:",
          notificationError
        );
      }
    }

    // 9. Return all product-wise order IDs
    return NextResponse.json({
      ok: true,
      orderId: anchor.id,
      orderIds: orders.map((order) => order.id),
      checkoutId: anchor.checkoutId,
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        error: "Verification failed",
      },
      { status: 400 }
    );
  }
}
