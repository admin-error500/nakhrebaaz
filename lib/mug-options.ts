export const MUG_COLORS = [
  { name: "White", code: "WHT", hex: "#ffffff" },
  { name: "Black", code: "BLK", hex: "#171717" },
  { name: "Yellow", code: "YLW", hex: "#ffb31a" },
  { name: "Pink", code: "PNK", hex: "#f7a9c4" },
  { name: "Blue", code: "BLU", hex: "#326acb" },
] as const;

export type MugColor = (typeof MUG_COLORS)[number]["name"];
export const MUG_STYLES=[{name:"Regular",code:"REG"},{name:"Magic",code:"MAG"}] as const;
// Historic Magic Mugs products must remain readable after removing the separate storefront category.
export const isMugCategory=(category:string)=>category==="Mugs"||category==="Magic Mugs";
export const mugVariantStyle=(size:string,category:string)=>
  category==="Magic Mugs"||/magic/i.test(size)?"Magic":"Regular";
export const mugSwatch = (color: string) => MUG_COLORS.find(c => c.name.toLowerCase() === color.toLowerCase())?.hex ?? "#dedede";
