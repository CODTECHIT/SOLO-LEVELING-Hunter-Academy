import { Platform } from "react-native";

// Font families — must match loaded expo-google-fonts names exactly
export const fonts = {
  display: Platform.select({
    ios: "Orbitron_700Bold",
    android: "Orbitron_700Bold",
    default: "Orbitron_700Bold",
  }),
  sans: Platform.select({
    ios: "Rajdhani_600SemiBold",
    android: "Rajdhani_600SemiBold",
    default: "Rajdhani_600SemiBold",
  }),
  body: Platform.select({
    ios: "Inter_400Regular",
    android: "Inter_400Regular",
    default: "Inter_400Regular",
  }),
  bodyMedium: Platform.select({
    ios: "Inter_500Medium",
    android: "Inter_500Medium",
    default: "Inter_500Medium",
  }),
  bodySemiBold: Platform.select({
    ios: "Inter_600SemiBold",
    android: "Inter_600SemiBold",
    default: "Inter_600SemiBold",
  }),
} as const;

export const fontSizes = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const lineHeights = {
  tight:  1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacings = {
  tight:   -0.5,
  normal:  0,
  wide:    1,
  widest:  2,
  display: 3,
} as const;
