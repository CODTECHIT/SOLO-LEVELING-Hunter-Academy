/**
 * Design tokens — OKLCH from the web converted to hex.
 * These are the single source of truth for all mobile styling.
 */
export const colors = {
  // Backgrounds
  background: "#1a1629",   // oklch(0.16 0.03 265)
  surface:    "#1e1d3a",   // oklch(0.21 0.035 267)
  surface2:   "#252446",   // oklch(0.26 0.045 270)
  card:       "#1e1d3a",

  // Text
  foreground:       "#f0eff8",  // oklch(0.95 0.01 260)
  mutedForeground:  "#7878a8",  // oklch(0.72 0.03 265)

  // Neon palette
  neonPurple: "#b060f0",  // oklch(0.65 0.24 305)
  neonCyan:   "#67e8f9",  // oklch(0.81 0.14 197)
  neonLime:   "#a3e635",  // oklch(0.85 0.19 145)
  neonPink:   "#f472b6",  // oklch(0.7 0.24 350)
  neonAmber:  "#fbbf24",  // oklch(0.83 0.16 82)

  // Semantic
  primary:     "#b060f0",
  accent:      "#67e8f9",
  destructive: "#ef4444",
  border:      "#3e3a60",  // oklch(0.35 0.06 275)
  input:       "#302c50",  // oklch(0.3 0.05 272)
  ring:        "#9d50e8",  // oklch(0.7 0.2 300)

  // Alpha helpers (for glow/overlay effects)
  neonPurpleAlpha20: "#b060f033",
  neonPurpleAlpha40: "#b060f066",
  neonCyanAlpha20:   "#67e8f933",
  neonCyanAlpha40:   "#67e8f966",
  neonLimeAlpha20:   "#a3e63533",
  neonAmberAlpha20:  "#fbbf2433",

  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type ColorToken = keyof typeof colors;
