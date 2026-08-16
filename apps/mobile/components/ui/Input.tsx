import React from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { colors, fonts, fontSizes, radii, spacing } from "@/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function Input({ label, error, containerStyle, style, value, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, error ? styles.inputError : null, style]}
        value={value ?? ""}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[1] },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    color: colors.foreground,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
  },
  inputError: { borderColor: colors.destructive },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.destructive,
  },
});
