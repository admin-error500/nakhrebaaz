"use client";
import {useEffect,useState} from "react";
type Garment="T-Shirt"|"Hoodie"|"Sweatshirt";
const charts:Record<Garment,{chest:number[];length:number[];shoulder:number[];fit:string}>={
 "T-Shirt":{chest:[36,38,40,42,44],length:[26,27,28,29,30],shoulder:[16,17,18,19,20],fit:"Choose your usual size for a regular fit."},
 "Hoodie":{chest:[40,42,44,46,48],length:[26,27,28,29,30],shoulder:[18,19,20,21,22],fit:"For a comfortable hoodie fit, consider buying one size larger than your usual T-shirt size."},
 "Sweatshirt":{chest:[38,40,42,44,46],length:[26,27,28,29,30],shoulder:[17,18,19,20,21],fit:"Choose your usual size for a relaxed fit; size up if you prefer extra room."},
};
const sizes=["S","M","L","XL","XXL"];
function pickGarment(name:string):Garment{
 if(/hoodie|hooded/i.test(name))return "Hoodie";
 if(/sweatshirt|sweater|sweat shirt/i.test(name))return "Sweatshirt";
 return "T-Shirt";
}
export function SizeChart({productName}:{productName:string}){
 const [open,setOpen]=useState(false);
 const type=pickGarment(productName),chart=charts[type];
 useEffect(()=>{
  if(!open)return;
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};
  document.addEventListener("keydown",key);
  return()=>document.removeEventListener("keydown",key);
 },[open]);
 return <>
  <button type="button" className="size-guide-link" onClick={()=>setOpen(true)} aria-haspopup="dialog">↗ View {type} Size Chart</button>
  {open&&<div className="size-chart-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
   <section role="dialog" aria-modal="true" aria-label={type+" size chart"} className="size-chart-modal">
    <div className="size-chart-header"><div><span className="eyebrow">FIND YOUR FIT</span><h2>{type.toUpperCase()} SIZE CHART</h2></div><button type="button" autoFocus aria-label="Close size chart" onClick={()=>setOpen(false)}>✕</button></div>
    <p className="size-chart-note">Reference sizing only, in inches. These are approximate example measurements, <strong>not manufacturer-verified measurements</strong>. Verify actual garment measurements before ordering.</p>
    <div className="size-chart-table-wrap"><table className="size-chart-table"><thead><tr><th>Measurement (in)</th>{sizes.map(v=><th key={v}>{v}</th>)}</tr></thead>
      <tbody>
        <tr><th>Chest circumference</th>{chart.chest.map((v,i)=><td key={i}>{v}</td>)}</tr>
        <tr><th>Garment length</th>{chart.length.map((v,i)=><td key={i}>{v}</td>)}</tr>
        <tr><th>Shoulder width</th>{chart.shoulder.map((v,i)=><td key={i}>{v}</td>)}</tr>
      </tbody></table></div>
    <div className="size-chart-howto"><h3>How to measure</h3>
      <p><strong>Chest:</strong> Measure around the fullest part of the chest while keeping the tape level.</p>
      <p><strong>Length:</strong> Measure from the highest shoulder point straight down to the hem.</p>
      <p><strong>Shoulder:</strong> Measure across the back, from shoulder seam to shoulder seam.</p>
    </div>
    <p className="size-fit-tip"><strong>Fit tip:</strong> {chart.fit}</p>
    <button type="button" className="btn dark" onClick={()=>setOpen(false)}>BACK TO PRODUCT</button>
   </section>
  </div>}
 </>;
}
