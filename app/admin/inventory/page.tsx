import {getInventoryPage} from "@/lib/admin-data";
import {InventoryEditor} from "@/components/inventory-editor";
export const dynamic="force-dynamic";
export default async function InventoryPage(){
 const page=await getInventoryPage();
 return <InventoryEditor editOnSeparatePage products={page.products} totalSold={0} totalAvailable={page.availableStock} nextCursor={page.nextCursor}/>;
}
