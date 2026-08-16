import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
// import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, fonts, fontSizes, radii, spacing } from "@/theme";

type ProgressBarProps = {
  value: number;        // 0–100
  color?: string;
  label?: string;
  showPercent?: boolean;
  height?: number;
};

export function ProgressBar({
  value,
  color = colors.neonPurple,
  label,
  showPercent = false,
  height = 6,
}: ProgressBarProps) {
  // const progress = useSharedValue(0);

  useEffect(() => {
    // progress.value = withTiming(Math.min(value, 100) / 100, { duration: 700 });
  }, [value]);

  const barStyle = {
    width: `${(Math.min(value, 100) / 100) * 100}%`,
  };

  return (
    <View style={styles.wrapper}>
      {(label || showPercent) && (
        <View style={styles.row}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercent && (
            <Text style={[styles.percent, { color }]}>{Math.round(value)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            { height, borderRadius: height / 2, backgroundColor: color },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  percent: { fontFamily: fonts.sans, fontSize: fontSizes.xs },
  track: {
    backgroundColor: colors.surface2,
    overflow: "hidden",
    width: "100%",
  },
  fill: { position: "absolute", left: 0, top: 0 },
});
