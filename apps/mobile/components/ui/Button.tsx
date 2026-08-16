import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, fonts, fontSizes, radii, spacing } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.neonPurple} />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.5 },

  // Variants
  primary: {
    backgroundColor: colors.neonPurple,
    borderColor: colors.neonPurple,
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.neonPurple + "60",
  },
  destructive: {
    backgroundColor: colors.destructive + "20",
    borderColor: colors.destructive,
  },

  // Sizes
  size_sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  size_md: { paddingVertical: spacing[3], paddingHorizontal: spacing[5] },
  size_lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8] },

  // Label
  label: { fontFamily: fonts.sans, letterSpacing: 1 },
  label_primary:     { color: colors.white },
  label_secondary:   { color: colors.foreground },
  label_ghost:       { color: colors.neonPurple },
  label_destructive: { color: colors.destructive },
  labelSize_sm:  { fontSize: fontSizes.sm },
  labelSize_md:  { fontSize: fontSizes.base },
  labelSize_lg:  { fontSize: fontSizes.md },
});
