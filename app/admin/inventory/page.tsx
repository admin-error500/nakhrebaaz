import { getInventoryData } from "@/lib/admin-data";
import { InventoryEditor } from "@/components/inventory-editor";
export const dynamic="force-dynamic";
export default async function InventoryPage(){
 const {products,totalSold,totalAvailable}=await getInventoryData();
 return <InventoryEditor products={products} totalSold={totalSold} totalAvailable={totalAvailable}/>;
}
