/**
 * Publish verified merchant contacts through the deployment environment.
 * No hard-coded email address or WhatsApp number is assumed.
 * Both contact links remain hidden until valid details are configured.
 */
const email=(process.env.NEXT_PUBLIC_CUSTOMIZATION_EMAIL || "").trim();
const rawWhatsApp=(process.env.NEXT_PUBLIC_CUSTOMIZATION_WHATSAPP_NUMBER || "").trim();
export const customizationEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
const number=rawWhatsApp.replace(/[^0-9]/g,"");
export const customizationWhatsApp=/^[1-9][0-9]{9,14}$/.test(number)?number:null;

const subject=(productName:string)=>"Custom design enquiry - "+productName;
const message=(productName:string)=>
  "Hello NakhreBaaz, I would like a custom design for "+productName+
  " for an event. Please share the design process, pricing and lead time. Event details: ";

export function customizationEmailUrl(productName:string):string|null{
 if(!customizationEmail)return null;
 return "mailto:"+customizationEmail+"?subject="+encodeURIComponent(subject(productName))+"&body="+encodeURIComponent(message(productName));
}
export function customizationWhatsAppUrl(productName:string):string|null{
 if(!customizationWhatsApp)return null;
 return "https://wa.me/"+customizationWhatsApp+"?text="+encodeURIComponent(message(productName));
}
