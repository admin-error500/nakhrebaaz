"use client";
import {useState} from "react";
import {MUG_COLORS,MUG_STYLES} from "@/lib/mug-options";

export function MugVariantFields(){
 const [selected,setSelected]=useState<string[]>(()=>MUG_COLORS.map(c=>"REG"+c.code));
 return <fieldset className="mug-variant-fieldset">
  <legend>Nakhra Mugs — Regular &amp; Magic options</legend>
  <p className="muted">Add both types inside one Mug product. Choose only real colours and stock. Each type and colour uses a separate SKU, with stock starting at 0.</p>
  <label className="mug-sku-prefix">Unique SKU prefix for this mug design
   <input name="skuPrefix" required minLength={3} pattern="[A-Za-z0-9-]+" title="Letters, numbers and hyphens only" placeholder="NB-MUG-NAKHRA01"/>
  </label>
  {MUG_STYLES.map(style=><div key={style.code} className="mug-style-group">
   <h4>{style.name} Mug</h4>
   <p className="muted">{style.code==="MAG"?"Heat-reveal mug: offer only colours your supplier can provide.":"Regular mug: select White, Black, Yellow, Pink or Blue."}</p>
   <div className="mug-color-rows">{MUG_COLORS.map(c=>{
    const id=style.code+c.code,checked=selected.includes(id);
    return <div className="mug-color-row" key={id}>
     <label className="mug-color-option">
      <input type="checkbox" name={"mugColor"+id} checked={checked}
        onChange={e=>setSelected(old=>e.target.checked?[...old,id]:old.filter(x=>x!==id))}/>
      <span className="mug-color-swatch" style={{backgroundColor:c.hex}} aria-hidden="true"/>
      <strong>{c.name}</strong><small> {style.code}-{c.code}</small>
     </label>
     <label className="mug-color-stock">Stock<input type="number" name={"mugStock"+id} min="0" step="1" defaultValue={0} disabled={!checked} required={checked}/></label>
    </div>;
   })}</div>
  </div>)}
  {selected.length===0&&<p className="error" role="alert">Select at least one mug type and colour.</p>}
  <p className="muted">SKU examples: NB-MUG-NAKHRA01-REG-WHT and NB-MUG-NAKHRA01-MAG-BLK. Both types currently share the product price.</p>
 </fieldset>;
}
