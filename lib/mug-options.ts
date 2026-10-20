export const MUG_COLORS = [
  { name: "White", code: "WHT", hex: "#ffffff" },
  { name: "Black", code: "BLK", hex: "#171717" },
  { name: "Yellow", code: "YLW", hex: "#ffb31a" },
  { name: "Pink", code: "PNK", hex: "#f7a9c4" },
  { name: "Blue", code: "BLU", hex: "#326acb" },
] as const;

export type MugColor = (typeof MUG_COLORS)[number]["name"];
export const isMugCategory = (category: string) => category === "Mugs" || category === "Magic Mugs";
export const mugSwatch = (color: string) => MUG_COLORS.find(c => c.name.toLowerCase() === color.toLowerCase())?.hex ?? "#dedede";
