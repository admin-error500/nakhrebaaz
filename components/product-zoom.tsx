"use client";
import {useState, useRef} from 'react';
export function ProductZoom({src,alt}:{src:string;alt:string}){
 const [zoom,setZoom]=useState(false); const [pos,setPos]=useState({x:50,y:50}); const [open,setOpen]=useState(false); const ref=useRef<HTMLDivElement>(null);
 function move(e:React.MouseEvent<HTMLDivElement>){const r=ref.current?.getBoundingClientRect();if(!r)return;setPos({x:Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)),y:Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100))});}
 return <><div className="zoom-wrap" ref={ref} onMouseMove={move} onMouseEnter={()=>setZoom(true)} onMouseLeave={()=>setZoom(false)} onClick={()=>setOpen(true)} role="button" tabIndex={0} aria-label="Enlarge product image" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(true)}}}>
 <img src={src} alt={alt} className="zoom-photo" style={{transform:zoom?'scale(1.9)':'scale(1)',transformOrigin:`${pos.x}% ${pos.y}%`}}/><span className="zoom-hint">⌕ HOVER TO ZOOM · CLICK TO EXPAND</span></div>
 {open&&<div className="zoom-modal" role="dialog" aria-modal="true" aria-label="Product image preview" onClick={()=>setOpen(false)}><button className="zoom-close" onClick={()=>setOpen(false)} aria-label="Close preview">×</button><img src={src} alt={alt} onClick={e=>e.stopPropagation()}/></div>}
 </>;
}
