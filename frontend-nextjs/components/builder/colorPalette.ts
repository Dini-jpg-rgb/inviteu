export const BUILDER_COLOR_PALETTE = [
  { name: "Cokelat Tua", hex: "#3A2313" },
  { name: "Amber", hex: "#FCB040" },
  { name: "Cream", hex: "#FDEBD3" },
  { name: "Paper", hex: "#FFF8EE" },
  { name: "Sand", hex: "#EBD9BE" },
  { name: "Amber Tua", hex: "#9A5A00" },
] as const;

export const BUILDER_COLOR_PRESETS = [
  {
    label: "InviteU",
    colors: BUILDER_COLOR_PALETTE.map(({ hex }) => hex),
  },
];
