import { getAdminOrders } from "@/lib/admin-data";
import { AdminPanel } from "@/components/admin-panel";
export const dynamic="force-dynamic";
export default async function OrdersPage(){
 const orders=await getAdminOrders();
 return <AdminPanel view="orders" orders={orders}/>;
}
