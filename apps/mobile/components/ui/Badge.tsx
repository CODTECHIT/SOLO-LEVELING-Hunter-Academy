import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSizes, radii, spacing } from "@/theme";

type Variant = "purple" | "cyan" | "lime" | "amber" | "pink" | "muted";

type BadgeProps = {
  label: string;
  variant?: Variant;
};

export function Badge({ label, variant = "purple" }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  purple: { backgroundColor: colors.neonPurpleAlpha20, borderColor: colors.neonPurple + "80" },
  cyan:   { backgroundColor: colors.neonCyanAlpha20,   borderColor: colors.neonCyan   + "80" },
  lime:   { backgroundColor: colors.neonLimeAlpha20,   borderColor: colors.neonLime   + "80" },
  amber:  { backgroundColor: colors.neonAmberAlpha20,  borderColor: colors.neonAmber  + "80" },
  pink:   { backgroundColor: colors.neonPink + "20",   borderColor: colors.neonPink   + "80" },
  muted:  { backgroundColor: colors.surface2,          borderColor: colors.border },
  label_purple: { color: colors.neonPurple },
  label_cyan:   { color: colors.neonCyan },
  label_lime:   { color: colors.neonLime },
  label_amber:  { color: colors.neonAmber },
  label_pink:   { color: colors.neonPink },
  label_muted:  { color: colors.mutedForeground },
});
