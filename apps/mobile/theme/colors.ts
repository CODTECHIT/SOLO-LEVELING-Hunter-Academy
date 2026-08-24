/**
 * Design tokens — OKLCH from the web converted to hex.
 * Single source of truth for all mobile styling.
 */
export const colors = {
  // Backgrounds
  background: "#0d0b18",   // Deep obsidian cyber background
  surface:    "#161329",   // Elevated cyber surface
  surface2:   "#211c3d",   // Secondary panel surface
  surface3:   "#2c2552",   // Highlight panel surface
  card:       "#161329",

  // Text
  foreground:       "#f8f7ff",
  mutedForeground:  "#9694c7",

  // Neon & Cyber Accent Palette
  neonPurple: "#c084fc",  // Bright electric violet
  neonCyan:   "#38bdf8",  // Vivid sky cyan
  neonLime:   "#4ade80",  // Radiant matrix green / lime
  neonPink:   "#f472b6",  // Vibrant neon rose
  neonAmber:  "#fbbf24",  // Radiant cyber gold
  neonOrange: "#fb923c",  // Solar flare orange
  neonRed:    "#f87171",  // Warning laser red

  // Semantic
  primary:     "#c084fc",
  accent:      "#38bdf8",
  destructive: "#ef4444",
  border:      "#352e5e",
  borderGlow:  "#4f46e5",
  input:       "#241e42",
  ring:        "#a855f7",

  // Alpha helpers (for glow/overlay effects)
  neonPurpleAlpha10: "rgba(192, 132, 252, 0.10)",
  neonPurpleAlpha20: "rgba(192, 132, 252, 0.20)",
  neonPurpleAlpha40: "rgba(192, 132, 252, 0.40)",
  neonCyanAlpha10:   "rgba(56, 189, 248, 0.10)",
  neonCyanAlpha20:   "rgba(56, 189, 248, 0.20)",
  neonCyanAlpha40:   "rgba(56, 189, 248, 0.40)",
  neonLimeAlpha10:   "rgba(74, 222, 128, 0.10)",
  neonLimeAlpha20:   "rgba(74, 222, 128, 0.20)",
  neonPinkAlpha20:   "rgba(244, 114, 182, 0.20)",
  neonAmberAlpha10:  "rgba(251, 191, 36, 0.10)",
  neonAmberAlpha20:  "rgba(251, 191, 36, 0.20)",

  // Rich Gradients
  gradients: {
    hero: ["#2d1b54", "#181333", "#0d0b18"] as const,
    cyanPurple: ["#38bdf8", "#c084fc", "#f472b6"] as const,
    purplePink: ["#c084fc", "#f472b6"] as const,
    cyberCyan: ["#06b6d4", "#38bdf8"] as const,
    emeraldLime: ["#10b981", "#4ade80"] as const,
    goldAmber: ["#fbbf24", "#f97316"] as const,
    darkCardCyan: ["rgba(56, 189, 248, 0.14)", "rgba(22, 19, 41, 0.95)"] as const,
    darkCardPurple: ["rgba(192, 132, 252, 0.14)", "rgba(22, 19, 41, 0.95)"] as const,
    darkCardLime: ["rgba(74, 222, 128, 0.14)", "rgba(22, 19, 41, 0.95)"] as const,
    darkCardAmber: ["rgba(251, 191, 36, 0.14)", "rgba(22, 19, 41, 0.95)"] as const,
  },

  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type ColorToken = keyof typeof colors;
