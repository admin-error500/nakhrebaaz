import {db} from "@/lib/db";
import {loadMerchandising} from "@/lib/merchandising";
import {MerchandisingManager} from "@/components/merchandising-manager";
export const dynamic="force-dynamic";
export default async function CollectionSettingsPage(){
 const [products,config]=await Promise.all([
  db.product.findMany({where:{active:true},orderBy:{createdAt:"desc"},select:{id:true,name:true,image:true,category:true,price:true}}),
  loadMerchandising(),
 ]);
 return <MerchandisingManager products={products} initial={config}/>;
}
