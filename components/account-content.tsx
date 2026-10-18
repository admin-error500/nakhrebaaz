
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderTracker } from "@/components/order-tracker";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Logout } from "@/components/logout";
import { ProfileEditor } from "@/components/profile-editor";
import { AddressBook } from "@/components/address-book";


export async function AccountContent({mode = 'overview'}: {mode?: 'overview' | 'profile' | 'orders' | 'addresses'}) {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, savedAddresses] = await Promise.all([
    db.user.findUnique({where:{id:user.id},select:{phone:true}}),
    db.savedAddress.findMany({where:{userId:user.id},orderBy:[{isDefault:"desc"},{createdAt:"desc"}]}),
  ]);

  const orders = await db.order.findMany({
    where: {
      userId: user.id,
    },
    include: {
      items: {
        include: {
          variant: {
            select: {
              productId: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="account-shell">
      {/* ACCOUNT HERO */}
      <section className="account-hero">
        <span className="account-eyebrow">
          THE NAKHRA CLUB / MEMBER SPACE
        </span>

        <h1>
          HEY, {user.name.split(" ")[0].toUpperCase()}
          <span>!</span>
        </h1>

        <p>Your fits. Your orders. Your attitude.</p>

        <div className="account-avatar" aria-hidden="true">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
      </section>

      <div className="account-grid">
        {/* SIDEBAR */}
        <aside className="account-side">
          <div className="account-side-title">
            MY SPACE
          </div>

          <a href="/account/profile" className="account-side-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>
            <span>My profile</span>
          </a>

          <a href="/account/orders" className="account-side-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 9h8M8 13h6"/></svg>
            <span>My orders</span>
          </a>

          <Link href="/account/addresses" className="account-side-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>Saved addresses</span>
          </Link>

          <Link href="/shop" className="account-side-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="account-side-icon"><path d="M5 19 19 5M8 5h11v11"/></svg>
            <span>Continue shopping</span>
          </Link>

          <div className="account-logout">
            <Logout />
          </div>
        </aside>

        <div className="account-main">
          {mode !== "orders" && <>
          {/* PROFILE */}
          <ProfileEditor name={user.name} email={user.email} phone={profile?.phone??""} />
          {mode !== "orders" && <AddressBook initial={savedAddresses} />}

          {/* ACCOUNT STATS */}
          {mode !== "addresses" && <div className="account-stats">
            <div>
              <small>TOTAL ORDERS</small>

              <strong>
                {orders.length
                  .toString()
                  .padStart(2, "0")}
              </strong>
            </div>

            <div>
              <small>YOUR STATUS</small>
              <strong>NAKHREBAAZ</strong>
            </div>
          </div>}

          </>}
          {mode === "orders" && <>
          {/* ORDER HISTORY */}
          <section
            id="orders"
            className="account-panel"
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  YOUR SHOPPING STORY
                </span>

                <h2>ORDER HISTORY</h2>
              </div>

              <Link
                className="account-shop-link"
                href="/#shop"
              >
                SHOP MORE ↗
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="orders-empty">
                <div className="empty-symbol">
                  ✳
                </div>

                <h3>NO ORDERS. YET.</h3>

                <p>
                  Time to find a fit that
                  matches your attitude.
                </p>

                <Link
                  className="btn dark"
                  href="/#shop"
                >
                  EXPLORE THE DROP ↗
                </Link>
              </div>
            ) : (
              <div className="order-stack">
                {orders.map((order) => {
                  // One product per order is required
                  // for the new invoice route.
                  const canDownloadInvoice =
                    order.paymentStatus === "PAID" &&
                    order.items.length === 1;

                  return (
                    <article
                      className="order-modern"
                      key={order.id}
                    >
                      {/* ORDER ID AND DATE */}
                      <div>
                        <small>
                          ORDER #
                          {order.id
                            .slice(-8)
                            .toUpperCase()}
                        </small>

                        <strong>
                          {new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </strong>
                      </div>

                      {/* ORDER STATUS */}
                      <div>
                        <small>STATUS</small>

                        <span className="order-status">
                          {order.status}

                          <span className="payment-label">
                            {" · "}
                            {order.paymentMethod ===
                            "COD"
                              ? order.paymentStatus ===
                                "PAID"
                                ? "COD received"
                                : "COD payment pending"
                              : order.paymentStatus ===
                                  "PAID"
                                ? "Online paid"
                                : "Online payment pending"}
                          </span>
                        </span>
                      </div>

                      {/* ORDER TOTAL */}
                      <div>
                        <small>TOTAL</small>

                        <strong>
                          ₹
                          {order.total.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      {/* ORDER TRACKER */}
                      <div className="order-tracker-row">
                        <OrderTracker
                          status={order.status}
                          paymentStatus={
                            order.paymentStatus
                          }
                          paymentMethod={
                            order.paymentMethod
                          }
                        />
                      </div>

                      {/* ORDERED PRODUCTS */}
                      <div className="order-history-products">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.variant?.productId ? (
                              <Link
                                href={`/product/${item.variant.productId}`}
                                className="order-product-link"
                              >
                                {item.name} ↗
                              </Link>
                            ) : (
                              <strong>
                                {item.name}
                              </strong>
                            )}

                            {" "}
                            ({item.size}/{item.color})
                            {" ×"}
                            {item.quantity}
                          </p>
                        ))}
                      </div>

                      {/* INVOICE DOWNLOAD */}
                      {canDownloadInvoice && (
                        <a
                          className="invoice-download-link"
                          href={`/api/orders/${order.id}/invoice`}
                          download
                        >
                          DOWNLOAD INVOICE ↓
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          </>}
        </div>
      </div>
    </main>
  );
}

