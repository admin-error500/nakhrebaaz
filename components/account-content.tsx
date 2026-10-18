
import Link from "next/link";
import { redirect } from "next/navigation";
import {UserOrderHistory} from "@/components/user-order-history";
import {getUserOrderPage} from "@/lib/order-pages";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountNavigation } from "@/components/account-navigation";

import { ProfileEditor } from "@/components/profile-editor";
import { AddressBook } from "@/components/address-book";


export async function AccountContent({mode = 'overview'}: {mode?: 'overview' | 'profile' | 'orders' | 'addresses'}) {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile,savedAddresses,userOrders]=await Promise.all([
    mode==="orders"?Promise.resolve(null):db.user.findUnique({where:{id:user.id},select:{phone:true}}),
    mode==="orders"||mode==="profile"?Promise.resolve([]):db.savedAddress.findMany({where:{userId:user.id},orderBy:[{isDefault:"desc"},{createdAt:"desc"}]}),
    mode==="orders"?getUserOrderPage(user.id):Promise.resolve(null),
  ]);

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
        <AccountNavigation />

        <div className="account-main">
          {mode !== "orders" && <>
          {/* PROFILE */}
          {mode !== "addresses" && <ProfileEditor key={user.name+":"+(profile?.phone??"")} name={user.name} email={user.email} phone={profile?.phone??""} />}
          {mode !== "profile" && <AddressBook initial={savedAddresses} />}

          </>}
          {mode==="orders"&&userOrders&&<UserOrderHistory initial={userOrders.orders} nextCursor={userOrders.nextCursor}/>}
        </div>
      </div>
    </main>
  );
}

