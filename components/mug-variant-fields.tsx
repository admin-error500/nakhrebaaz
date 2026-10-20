"use client";
import { useState } from "react";
import { MUG_COLORS } from "@/lib/mug-options";

export function MugVariantFields({magic}:{magic:boolean}){
  const [selected,setSelected]=useState<string[]>(()=>magic?["Black"]:MUG_COLORS.map(c=>c.name));
  return <fieldset className="mug-variant-fieldset">
    <legend>Choose {magic?"Magic Mug":"Mug"} colours and stock</legend>
    <p className="muted">Choose actual colours you can supply. Each selected colour creates a separate One Size variant with its own stock and SKU. Stock starts at 0.</p>
    <label className="mug-sku-prefix">SKU prefix for this design
      <input required name="skuPrefix" minLength={3} pattern="[A-Za-z0-9-]+" title="Letters, numbers and hyphens only" placeholder={magic?"NB-MAG-NAKHRA01":"NB-MUG-NAKHRA01"}/>
    </label>
    <div className="mug-color-rows">{MUG_COLORS.map(c=>{
      const checked=selected.includes(c.name);
      return <div className="mug-color-row" key={c.name}>
        <label className="mug-color-option">
          <input type="checkbox" name={"mugColor"+c.code} checked={checked} onChange={e=>setSelected(old=>e.target.checked?[...old,c.name]:old.filter(n=>n!==c.name))}/>
          <span className="mug-color-swatch" style={{backgroundColor:c.hex}} aria-hidden="true"/>
          <strong>{c.name}</strong><small> - {c.code}</small>
        </label>
        <label className="mug-color-stock">Stock
          <input type="number" min="0" step="1" defaultValue={0} name={"mugStock"+c.code} disabled={!checked} required={checked}/>
        </label>
      </div>;
    })}</div>
    {selected.length===0&&<p className="error" role="alert">Select at least one colour.</p>}
    <p className="muted">For example, prefix NB-MUG-NAKHRA01 + White creates SKU NB-MUG-NAKHRA01-WHT. Use a different prefix for each design.</p>
    {magic&&<p className="muted">Magic mug colours depend on the actual heat-reveal mug blanks supplied. Black is preselected; other colours are optional. Only enter stock you really have.</p>}
  </fieldset>;
}
