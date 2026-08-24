import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing, shadows } from "@/theme";

type Accent = "purple" | "cyan" | "lime" | "pink" | "amber" | "none";

type CardProps = {
  children: React.ReactNode;
  accent?: Accent;
  style?: ViewStyle;
  gradient?: boolean;
};

const gradientMap: Record<Accent, readonly [string, string]> = {
  cyan: colors.gradients.darkCardCyan,
  purple: colors.gradients.darkCardPurple,
  lime: colors.gradients.darkCardLime,
  amber: colors.gradients.darkCardAmber,
  pink: ["rgba(244, 114, 182, 0.14)", "rgba(22, 19, 41, 0.95)"] as const,
  none: [colors.surface, colors.background] as const,
};

export function Card({ children, accent = "none", style, gradient = true }: CardProps) {
  if (accent !== "none" && gradient) {
    return (
      <LinearGradient
        colors={gradientMap[accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.base,
          styles[`accent_${accent}`],
          style,
        ]}
      >
        <View style={[styles.topGlowLine, styles[`glowLine_${accent}`]]} />
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.base,
        accent !== "none" && styles[`accent_${accent}`],
        style,
      ]}
    >
      {accent !== "none" && <View style={[styles.topGlowLine, styles[`glowLine_${accent}`]]} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    overflow: "hidden",
    ...shadows.card,
  },
  topGlowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  glowLine_cyan: {
    backgroundColor: colors.neonCyan,
  },
  glowLine_purple: {
    backgroundColor: colors.neonPurple,
  },
  glowLine_lime: {
    backgroundColor: colors.neonLime,
  },
  glowLine_amber: {
    backgroundColor: colors.neonAmber,
  },
  glowLine_pink: {
    backgroundColor: colors.neonPink,
  },
  glowLine_none: {
    backgroundColor: "transparent",
  },
  accent_purple: {
    borderColor: colors.neonPurpleAlpha40,
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  accent_cyan: {
    borderColor: colors.neonCyanAlpha40,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  accent_lime: {
    borderColor: colors.neonLimeAlpha20,
    shadowColor: colors.neonLime,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  accent_amber: {
    borderColor: colors.neonAmberAlpha20,
    shadowColor: colors.neonAmber,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  accent_pink: {
    borderColor: colors.neonPinkAlpha20,
    shadowColor: colors.neonPink,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  accent_none: {},
});
