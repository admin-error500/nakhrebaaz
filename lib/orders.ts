
import { randomUUID } from "crypto";
import { db } from "./db";
import type { priceCart } from "./checkout";

type PricedCart = Awaited<ReturnType<typeof priceCart>>;

export async function reserveOrder(
  userId: string,
  address: unknown,
  priced: PricedCart,
  method: string
) {
  if (
    priced.lines.length === 0 ||
    priced.productOrders.length !== priced.lines.length
  ) {
    throw new Error("Invalid cart");
  }

  const checkoutId = randomUUID();

  return db.$transaction(async (tx) => {
    // Reserve stock for every variant
    for (const line of priced.lines) {
      const result = await tx.variant.updateMany({
        where: {
          id: line.variantId,
          stock: { gte: line.quantity },
        },
        data: {
          stock: { decrement: line.quantity },
        },
      });

      if (result.count !== 1) {
        throw new Error("Stock changed, please retry");
      }
    }

    // Create one order per distinct variant
    const orders = [];

    for (const productOrder of priced.productOrders) {
      const order = await tx.order.create({
        data: {
          userId,
          checkoutId,
          addressJson: JSON.stringify(address),
          paymentMethod: method,

          subtotal: productOrder.subtotal,
          shipping: productOrder.shipping,
          total: productOrder.total,

          items: {
            create: [
              {
                variantId: productOrder.variantId,
                quantity: productOrder.quantity,
                price: productOrder.price,
                name: productOrder.name,
                size: productOrder.size,
                color: productOrder.color,
              },
            ],
          },
        },
      });

      orders.push(order);
    }

    return {
      checkoutId,
      orders,
      orderId: orders[0].id,
      orderIds: orders.map((order) => order.id),
      total: priced.total,
    };
  });
}

// Cancel unpaid orders in a checkout and restore stock once
export async function releaseStock(orderId: string) {
  return db.$transaction(async (tx) => {
    const anchor = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!anchor) return;

    const orders = await tx.order.findMany({
      where: anchor.checkoutId
        ? { checkoutId: anchor.checkoutId }
        : { id: orderId },
      include: { items: true },
    });

    if (
      orders.some(
        (order) => order.paymentStatus === "PAID"
      )
    ) {
      return;
    }

    for (const order of orders) {
      if (order.status === "CANCELLED") {
        continue;
      }

      const changed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          paymentStatus: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (changed.count !== 1) {
        throw new Error(
          "Order state changed during cancellation"
        );
      }

      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    }
  });
}
