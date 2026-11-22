export const BUILDER_COLOR_PALETTE = [
  { name: "Primary Orange", hex: "#FFAD38" },
  { name: "Dark Brown Sidebar", hex: "#3D2516" },
  { name: "Dark Brown Text", hex: "#422B1C" },
  { name: "Main Background", hex: "#F7F6F4" },
  { name: "Card White", hex: "#FFFFFF" },
  { name: "Border Sand", hex: "#EAE5DF" },
  { name: "Secondary Gray", hex: "#99918A" },
  { name: "Success Green", hex: "#258447" },
  { name: "Warning Amber", hex: "#F5A623" },
  { name: "Danger Red", hex: "#CB3025" },
] as const;

export const BUILDER_COLOR_PRESETS = [
  {
    label: "InviteU",
    colors: BUILDER_COLOR_PALETTE.map(({ hex }) => hex),
  },
];
