import type {ReactNode} from "react";

const channels=[
 {name:"Instagram",env:process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/nakhrebaaz.official/",host:"instagram.com",icon:"◎"},
 {name:"Facebook",env:process.env.NEXT_PUBLIC_FACEBOOK_URL,host:"facebook.com",icon:"f"},
 {name:"YouTube",env:process.env.NEXT_PUBLIC_YOUTUBE_URL,host:"youtube.com",icon:"▶"},
 {name:"X (Twitter)",env:process.env.NEXT_PUBLIC_X_URL,host:"x.com",icon:"𝕏"},
 {name:"WhatsApp",env:process.env.NEXT_PUBLIC_WHATSAPP_URL,host:"wa.me",icon:"✆"},
];
function validLink(value:string|undefined,host:string){
 if(!value)return null;
 try{
  const url=new URL(value.trim());
  if(url.protocol!=="https:")return null;
  const hostname=url.hostname.toLowerCase();
  const permitted=host==="youtube.com"?["youtube.com","www.youtube.com","youtu.be"]:
   host==="x.com"?["x.com","www.x.com","twitter.com","www.twitter.com"]:
   host==="wa.me"?["wa.me","api.whatsapp.com"]:
   [host,"www."+host];
  if(!permitted.includes(hostname))return null;
  return url.toString();
 }catch{return null;}
}
export function SocialLinks(){
 const links=channels.map(c=>({...c,url:validLink(c.env,c.host)})).filter(c=>c.url);
 if(!links.length)return <p className="social-coming-soon">Follow us on social media — links coming soon.</p>;
 return <nav aria-label="NakhreBaaz social media" className="footer-social-links">
  {links.map(c=><a key={c.name} href={c.url!} target="_blank" rel="noopener noreferrer" aria-label={`NakhreBaaz on ${c.name} (opens in new tab)`} title={c.name}>
   <span className="social-icon" aria-hidden="true">{c.icon}</span><span>{c.name}</span>
  </a>)}
 </nav>;
}
