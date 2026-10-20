import {customizationEmailUrl,customizationWhatsAppUrl} from "@/lib/customization-contact";

export const CUSTOMIZATION_MESSAGE="Custom designs available for your events.";

export function CustomizationLinks({productName}:{productName:string}){
 const mail=customizationEmailUrl(productName);
 const whatsapp=customizationWhatsAppUrl(productName);
 if(!mail&&!whatsapp)return null;
 return <div className="customization-contact-links" aria-label={"Contact NakhreBaaz to customize "+productName}>
  {mail&&<a href={mail} className="customization-contact-email">✉ Email</a>}
  {whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="customization-contact-whatsapp">WhatsApp ↗</a>}
 </div>;
}

export function ProductCardDetails({description,productName}:{description:string;productName:string}){
 return <div className="product-card-details">
  <p className="product-card-description">{description.trim()||"Wear your Nakhra, your way."}</p>
  <p className="product-event-customization">✳ {CUSTOMIZATION_MESSAGE}</p>
  <CustomizationLinks productName={productName}/>
 </div>;
}

export function ProductDetailCustomization({productName}:{productName:string}){
 return <section className="product-customization-info" aria-label="Custom event designs">
  <strong>MAKE IT YOUR NAKHRA ✳</strong>
  <p>{CUSTOMIZATION_MESSAGE} Personalize for birthdays, weddings, corporate events, festivals and other celebrations.</p>
  <p className="product-customization-policy">Personalized clothing is not returnable for change of mind after production. Damaged, defective or incorrect items remain eligible for review. <a href="/policies/returns">Read Return Policy</a>.</p>
  <CustomizationLinks productName={productName}/>
 </section>;
}
