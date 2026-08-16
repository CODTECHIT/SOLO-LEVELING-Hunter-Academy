import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
// import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
// import { useEffect } from "react";
import { colors, radii } from "@/theme";

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = radii.md, style }: SkeletonProps) {
  return (
    <View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.surface2 },
        style
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={160} borderRadius={radii.lg} />
      <View style={styles.body}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={12} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  body: {
    padding: 12,
    gap: 8,
  },
});
