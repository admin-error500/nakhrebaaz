import { getInventoryData } from "@/lib/admin-data";
import { loadSale } from "@/lib/sale";
import { SaleManagement } from "@/components/sale-management";
export const dynamic="force-dynamic";
export default async function SalesPage(){
 const [{products},sale]=await Promise.all([getInventoryData(),loadSale()]);
 return <SaleManagement initial={{...sale.settings,startsAt:sale.settings.startsAt?.toISOString()??null,endsAt:sale.settings.endsAt?.toISOString()??null}}
  products={products.map(p=>({id:p.id,name:p.name,price:p.price,category:p.category,image:p.image,discountPercent:p.saleDiscountPercent}))}/>;
}
