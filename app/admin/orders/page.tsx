import {getAdminOrderPage} from "@/lib/admin-data";
import {AdminPanel} from "@/components/admin-panel";
export const dynamic="force-dynamic";
export default async function OrdersPage(){
 const page=await getAdminOrderPage();
 return <AdminPanel view="orders" orders={page.orders} nextCursor={page.nextCursor}/>;
}
