
import { currentUser } from "@/lib/auth";
import { checkoutSchema, priceCart } from "@/lib/checkout";
import { reserveOrder, releaseStock } from "@/lib/orders";
import { db } from "@/lib/db";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before checkout" },
      { status: 401 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        error:
          "Online payments not configured. Choose COD.",
      },
      { status: 503 }
    );
  }

  let reservedOrderId = "";

  try {
    const data = checkoutSchema.parse(await req.json());
    const priced = await priceCart(data.items);

    const checkout = await reserveOrder(
      user.id,
      data.address,
      priced,
      "ONLINE"
    );

    reservedOrderId = checkout.orderId;

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const payment = await razorpay.orders.create({
      amount: priced.total * 100,
      currency: "INR",
      receipt: checkout.checkoutId.slice(0, 30),
    });

    const updated = await db.order.updateMany({
      where: {
        checkoutId: checkout.checkoutId,
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        status: "PENDING",
      },
      data: {
        paymentOrderId: payment.id,
      },
    });

    if (updated.count !== checkout.orders.length) {
      throw new Error(
        "Could not link all orders to payment"
      );
    }

    return NextResponse.json({
      orderId: checkout.orderId,
      orderIds: checkout.orderIds,
      checkoutId: checkout.checkoutId,
      razorpayOrderId: payment.id,
      key: keyId,
      amount: priced.total * 100,
    });
  } catch (error) {
    if (reservedOrderId) {
      try {
        await releaseStock(reservedOrderId);
      } catch (releaseError) {
        console.error(
          "Stock release failed:",
          releaseError
        );
      }
    }

    console.error(
      "Razorpay checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment initialization failed",
      },
      { status: 400 }
    );
  }
}
