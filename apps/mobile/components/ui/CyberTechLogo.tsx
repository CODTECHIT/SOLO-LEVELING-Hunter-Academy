import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Animated, ViewStyle } from "react-native";
import { colors } from "@/theme";

interface CyberTechLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  horizontal?: boolean;
  style?: ViewStyle;
}

export function CyberTechLogo({
  size = "md",
  showText = true,
  horizontal = false,
  style,
}: CyberTechLogoProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleAnim, glowAnim]);

  const dimensions = {
    sm: { imgWidth: 36, imgHeight: 36, titleSize: 13, subSize: 8 },
    md: { imgWidth: 54, imgHeight: 54, titleSize: 18, subSize: 10 },
    lg: { imgWidth: 84, imgHeight: 84, titleSize: 24, subSize: 12 },
    xl: { imgWidth: 120, imgHeight: 120, titleSize: 30, subSize: 14 },
  }[size];

  return (
    <View style={[horizontal ? styles.row : styles.column, style]}>
      {/* Animated Glowing Logo Box */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: dimensions.imgWidth + 16,
            height: dimensions.imgHeight + 16,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow backdrop aura */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              opacity: glowAnim,
              borderRadius: (dimensions.imgWidth + 16) / 2,
            },
          ]}
        />

        <Image
          source={require("../../assets/logo.png")}
          style={{
            width: dimensions.imgWidth,
            height: dimensions.imgHeight,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand Text */}
      {showText && (
        <View style={horizontal ? styles.textHorizontal : styles.textVertical}>
          <Text
            style={[
              styles.brandTitle,
              { fontSize: dimensions.titleSize },
            ]}
          >
            CYBER TECH ACADEMY
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowAura: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 243, 255, 0.25)",
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  textVertical: {
    alignItems: "center",
    marginTop: 8,
  },
  textHorizontal: {
    marginLeft: 10,
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: "Orbitron_700Bold",
    color: colors.foreground,
    letterSpacing: 2,
    fontWeight: "900",
  },
  brandSubtitle: {
    fontFamily: "Rajdhani_700Bold",
    color: colors.neonCyan,
    letterSpacing: 3,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
