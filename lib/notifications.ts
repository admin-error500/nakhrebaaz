import { db } from "@/lib/db";

type Notice = "WELCOME" | "ORDER_PLACED" | "PAYMENT_PAID" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "COD_RECEIVED";
const titles: Record<Notice, string> = {
 WELCOME: "Welcome to NakhreBaaz!", ORDER_PLACED: "Your NakhreBaaz order is placed",
 PAYMENT_PAID: "Payment received for your NakhreBaaz order", CONFIRMED: "Your order is confirmed",
 PACKED: "Your order is packed", SHIPPED: "Your order has shipped", DELIVERED: "Your order was delivered",
 CANCELLED: "Your order was cancelled", COD_RECEIVED: "Cash on delivery payment received",
};
function safe(s: string) { return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c)); }
export async function sendMail(to: string, subject: string, body: string) {
 const key = process.env.RESEND_API_KEY;
 const from = process.env.EMAIL_FROM;
 if (!key || !from) { console.info("Email skipped: RESEND_API_KEY / EMAIL_FROM not configured"); return; }
 try {
  const res = await fetch("https://api.resend.com/emails", {
   method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
   body:JSON.stringify({from,to:[to],subject,html:`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#111"><div style="background:#111;color:#ffb000;padding:24px"><h1>NAKHREBAAZ</h1><p>WEAR YOUR NAKHRA.</p></div><div style="padding:24px"><h2>${safe(subject)}</h2><p>${safe(body).replace(/\n/g,"<br>")}</p></div></div>`})
  });
  if (!res.ok) console.error("Email provider rejected notification",res.status,await res.text());
 } catch (err) { console.error("Email delivery request failed",err); }
}
export async function notifyWelcome(user: {email:string;name:string}) {
 await sendMail(user.email,titles.WELCOME,`Hi ${user.name},\nWelcome to the NakhreBaaz club!`);
}
export async function notifyOrder(orderId:string,event:Exclude<Notice,"WELCOME">) {
 try {
  const order=await db.order.findUnique({where:{id:orderId},include:{user:{select:{email:true,name:true}},items:true}});
  if (!order) return;
  const items=order.items.map(i=>`${i.name} (${i.size}/${i.color}) x ${i.quantity}`).join("\n");
  const base=`Hi ${order.user.name},\nOrder #${order.id.slice(-8).toUpperCase()}\n${items}\nTotal: INR ${order.total}\nPayment: ${order.paymentMethod} / ${order.paymentStatus}`;
  const url=process.env.NEXT_PUBLIC_SITE_URL;
  await sendMail(order.user.email,titles[event],`${base}${url?`\nView order and download summary: ${url}/account`:""}`);
 } catch(err) { console.error("Order notification failed",err); }
}
