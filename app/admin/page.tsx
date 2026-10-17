
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminPanel } from "@/components/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Check login
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  // Only administrators can access dashboard
  if (user.role !== "ADMIN") {
    redirect("/account");
  }

  // Fetch inventory with variant stock
  const products = await db.product.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch all customer orders
  const orders = await db.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Count sold units from non-cancelled COD orders or verified PAID online orders.
  // Unpaid online reservations are excluded from the sales count.
  const soldOrders = orders.filter(order =>
    order.status !== "CANCELLED" &&
    (order.paymentMethod === "COD" || order.paymentStatus === "PAID")
  );
  const soldByVariant = new Map<string, number>();
  for (const order of soldOrders) {
    for (const item of order.items) {
      soldByVariant.set(item.variantId, (soldByVariant.get(item.variantId) ?? 0) + item.quantity);
    }
  }
  const totalSold = [...soldByVariant.values()].reduce((sum, qty) => sum + qty, 0);
  const totalAvailable = products.reduce((sum, product) =>
    sum + (product.active ? product.variants.reduce((n, v) => n + v.stock, 0) : 0), 0);

  // Convert database results to AdminPanel props
  const formattedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description,
    image: product.image,
    active: product.active,
    sold: product.variants.reduce((total, v) => total + (soldByVariant.get(v.id) ?? 0), 0),
    category: product.category,
    festival: product.festival ?? null,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      sold: soldByVariant.get(variant.id) ?? 0,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    })),
  }));

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    name: order.user.name,
    email: order.user.email,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    addressJson: order.addressJson,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
  }));

  return (
  <main className="admin-dashboard-shell">
    <section className="admin-header">
        <h1>ADMIN DASHBOARD</h1>
        <p>
          Manage customer orders, product inventory,
          payments and festival collections.
        </p>
      </section>

      <AdminPanel
        products={formattedProducts}
        orders={formattedOrders}
        totalSold={totalSold}
        totalAvailable={totalAvailable}
      />
    </main>
  );
}
