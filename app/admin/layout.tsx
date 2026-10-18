import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin-navigation";

export const dynamic="force-dynamic";

export default async function AdminLayout({children}:{children:React.ReactNode}){
 const user=await currentUser();
 if(!user)redirect("/login");
 if(user.role!=="ADMIN")redirect("/account");
 return <main className="admin-dashboard-shell admin-multipage-shell">
  <header className="admin-header">
   <span className="eyebrow">STORE ADMINISTRATION</span>
   <h1>ADMIN DASHBOARD</h1>
   <p>Manage your store from dedicated pages. Orders, products and settings stay connected.</p>
  </header>
  <AdminNavigation/>
  <div className="admin-multipage-main">{children}</div>
 </main>;
}
