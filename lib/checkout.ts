
import { z } from "zod";
import { db } from "./db";
import { loadSale, salePrice } from "./sale";

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(30),

  address: z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    line1: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/),
  }),
});

export type CheckoutItem = {
  variantId: string;
  quantity: number;
};

export type ProductOrder = {
  variantId: string;
  quantity: number;
  price: number;
  name: string;
  size: string;
  color: string;
  subtotal: number;
  shipping: number;
  total: number;
};

export async function priceCart(items: CheckoutItem[]) {
  if (!items.length || items.length > 30) {
    throw new Error("Invalid cart");
  }

  for (const item of items) {
    if (
      !item.variantId ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10
    ) {
      throw new Error("Invalid cart item");
    }
  }

  const ids = items.map((item) => item.variantId);

  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate variants");
  }

  const variants = await db.variant.findMany({
    where: {
      id: { in: ids },
    },
    include: {
      product: true,
    },
  });

  if (variants.length !== items.length) {
    throw new Error("Invalid variant");
  }

  const variantMap = new Map(
    variants.map((variant) => [variant.id, variant])
  );

  const { live } = await loadSale();
  const lines = items.map((item) => {
    const variant = variantMap.get(item.variantId);

    if (!variant) {
      throw new Error("Variant not found");
    }

    if (
      !variant.product.active ||
      variant.stock < item.quantity
    ) {
      throw new Error("Item unavailable or out of stock");
    }

    const price = salePrice(variant.product.price, variant.product.saleDiscountPercent ?? 0, live);

    if (!Number.isSafeInteger(price) || price <= 0) {
      throw new Error("Invalid product price");
    }

    return {
      variantId: variant.id,
      quantity: item.quantity,
      price,
      name: variant.product.name,
      size: variant.size,
      color: variant.color,
    };
  });

  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );

  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
    throw new Error("Invalid cart subtotal");
  }

  const shipping = subtotal >= 1499 ? 0 : 99;
  const total = subtotal + shipping;

  let allocatedShipping = 0;

  const productOrders: ProductOrder[] = lines.map(
    (line, index) => {
      const productSubtotal = line.price * line.quantity;

      const productShipping =
        index === lines.length - 1
          ? shipping - allocatedShipping
          : Math.floor(
              (shipping * productSubtotal) / subtotal
            );

      allocatedShipping += productShipping;

      return {
        ...line,
        subtotal: productSubtotal,
        shipping: productShipping,
        total: productSubtotal + productShipping,
      };
    }
  );

  const calculatedTotal = productOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  if (calculatedTotal !== total) {
    throw new Error("Order total mismatch");
  }

  return {
    lines,
    productOrders,
    subtotal,
    shipping,
    total,
  };
}
