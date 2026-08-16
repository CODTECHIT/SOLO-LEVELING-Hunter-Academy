import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, spacing, shadows } from "@/theme";

type Accent = "purple" | "cyan" | "lime" | "amber" | "none";

type CardProps = {
  children: React.ReactNode;
  accent?: Accent;
  style?: ViewStyle;
};

export function Card({ children, accent = "none", style }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        accent !== "none" && styles[`accent_${accent}`],
        style,
      ]}
    >
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
    ...shadows.card,
  },
  accent_purple: {
    borderColor: colors.neonPurple + "60",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  accent_cyan: {
    borderColor: colors.neonCyan + "60",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  accent_lime: {
    borderColor: colors.neonLime + "60",
    shadowColor: colors.neonLime,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  accent_amber: {
    borderColor: colors.neonAmber + "60",
    shadowColor: colors.neonAmber,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
});
