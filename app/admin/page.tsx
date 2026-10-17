
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

  // Convert database results to AdminPanel props
  const formattedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    festival: product.festival ?? null,
    variants: product.variants.map((variant) => ({
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
        <span className="eyebrow">NAKHREBAAZ CONTROL CENTER</span>
        <h1>ADMIN DASHBOARD</h1>
        <p>
          Manage customer orders, product inventory,
          payments and festival collections.
        </p>
      </section>

      <AdminPanel
        products={formattedProducts}
        orders={formattedOrders}
      />
    </main>
  );
}
