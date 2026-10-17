
import { notifyOrder } from "@/lib/notifications";
import { currentUser } from "@/lib/auth";
import { checkoutSchema, priceCart } from "@/lib/checkout";
import { reserveOrder } from "@/lib/orders";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before checkout" },
      { status: 401 }
    );
  }

  try {
    const data = checkoutSchema.parse(await req.json());

    const priced = await priceCart(data.items);

    const checkout = await reserveOrder(
      user.id,
      data.address,
      priced,
      "COD"
    );

    // Send notification for each product order
    for (const order of checkout.orders) {
      try {
        await notifyOrder(order.id, "ORDER_PLACED");
      } catch (error) {
        console.error(
          `Notification failed for order ${order.id}:`,
          error
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: checkout.orderId,
        orderIds: checkout.orderIds,
        checkoutId: checkout.checkoutId,
        total: checkout.total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("COD checkout error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid checkout",
      },
      { status: 400 }
    );
  }
}
