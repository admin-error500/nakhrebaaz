import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

type CheckoutItem = {
  variantId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number; // Verified server-side unit price
};

type CreateProductOrdersInput = {
  userId: string;
  addressJson: string;
  paymentMethod: "COD" | "RAZORPAY";
  items: CheckoutItem[];
  shipping: number;
};

export async function createProductOrders({
  userId,
  addressJson,
  paymentMethod,
  items,
  shipping,
}: CreateProductOrdersInput) {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  if (
    !Number.isSafeInteger(shipping) ||
    shipping < 0 ||
    items.some(
      (item) =>
        !Number.isSafeInteger(item.price) ||
        item.price < 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
    )
  ) {
    throw new Error("Invalid checkout amounts");
  }

  const checkoutId = randomUUID();

  // Allocate shipping proportionally, preserving exact total.
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
    throw new Error("Invalid subtotal");
  }

  let allocatedShipping = 0;

  const allocations = items.map((item, index) => {
    const itemSubtotal = item.price * item.quantity;

    const itemShipping =
      index === items.length - 1
        ? shipping - allocatedShipping
        : Math.floor((shipping * itemSubtotal) / subtotal);

    allocatedShipping += itemShipping;

    return {
      ...item,
      itemSubtotal,
      itemShipping,
    };
  });

  const orders = await db.$transaction(
    allocations.map((item) =>
      db.order.create({
        data: {
          checkoutId,
          userId,
          addressJson,
          status: "PENDING",
          paymentMethod,
          paymentStatus: "PENDING",
          subtotal: item.itemSubtotal,
          shipping: item.itemShipping,
          total: item.itemSubtotal + item.itemShipping,

          items: {
            create: {
              variantId: item.variantId,
              name: item.name,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              price: item.price,
            },
          },
        },
        include: {
          items: true,
        },
      })
    )
  );

  return {
    checkoutId,
    orderIds: orders.map((order) => order.id),
    orders,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}