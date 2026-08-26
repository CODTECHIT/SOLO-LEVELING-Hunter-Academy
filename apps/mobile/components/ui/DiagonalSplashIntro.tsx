import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { colors, fonts } from "@/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DiagonalSplashIntroProps {
  onFinish?: () => void;
}

export function DiagonalSplashIntro({ onFinish }: DiagonalSplashIntroProps) {
  const [stage, setStage] = useState<"meteor" | "impact" | "exit" | "done">("meteor");

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const meteorScale = useRef(new Animated.Value(1.6)).current;
  const meteorOpacity = useRef(new Animated.Value(0)).current;
  const meteorTranslateY = useRef(new Animated.Value(-60)).current;

  const shakeTranslateX = useRef(new Animated.Value(0)).current;
  const shakeTranslateY = useRef(new Animated.Value(0)).current;

  const shockwaveScale1 = useRef(new Animated.Value(0.2)).current;
  const shockwaveOpacity1 = useRef(new Animated.Value(0)).current;
  const shockwaveScale2 = useRef(new Animated.Value(0.2)).current;
  const shockwaveOpacity2 = useRef(new Animated.Value(0)).current;

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const statusPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Pulse status text
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 0.4,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 1. Stage: Entrance Animation (0ms - 650ms)
    Animated.parallel([
      Animated.timing(meteorScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(meteorOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(meteorTranslateY, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Stage: Impact Shockwaves & Glow (650ms)
    const tImpact = setTimeout(() => {
      setStage("impact");

      // Flash
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.4,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Screen Shake
      Animated.sequence([
        Animated.timing(shakeTranslateX, { toValue: 5, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: -5, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeTranslateY, { toValue: 4, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: 2, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeTranslateY, { toValue: 0, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: 0, duration: 35, useNativeDriver: true }),
      ]).start();

      // Shockwave Ring 1 (Cyan)
      shockwaveOpacity1.setValue(0.9);
      Animated.parallel([
        Animated.timing(shockwaveScale1, {
          toValue: 2.6,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveOpacity1, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

      // Shockwave Ring 2 (Purple)
      setTimeout(() => {
        shockwaveOpacity2.setValue(0.8);
        Animated.parallel([
          Animated.timing(shockwaveScale2, {
            toValue: 3.0,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity2, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start();
      }, 120);
    }, 650);

    // 3. Stage: Smooth Exit Fade (1700ms)
    const tExit = setTimeout(() => {
      setStage("exit");
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(meteorScale, {
          toValue: 1.05,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1700);

    // 4. Complete & Unmount (2200ms)
    const tDone = setTimeout(() => {
      setStage("done");
      pulseLoop.stop();
      if (onFinish) {
        onFinish();
      }
    }, 2200);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tExit);
      clearTimeout(tDone);
      pulseLoop.stop();
    };
  }, []);

  if (stage === "done") {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.fullscreenContainer,
        {
          opacity: containerOpacity,
        },
      ]}
      pointerEvents={stage === "exit" ? "none" : "auto"}
    >
      <Animated.View
        style={[
          styles.shakeContainer,
          {
            transform: [
              { translateX: shakeTranslateX },
              { translateY: shakeTranslateY },
            ],
          },
        ]}
      >
        {/* Shockwave Rings */}
        <Animated.View
          style={[
            styles.shockwaveRing,
            {
              borderColor: colors.neonCyan,
              shadowColor: colors.neonCyan,
              transform: [{ scale: shockwaveScale1 }],
              opacity: shockwaveOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shockwaveRing,
            {
              borderColor: colors.neonPurple,
              shadowColor: colors.neonPurple,
              transform: [{ scale: shockwaveScale2 }],
              opacity: shockwaveOpacity2,
            },
          ]}
        />

        {/* Brand Content (Logo & Title) */}
        <View style={styles.brandContainer}>
          <Animated.View
            style={[
              styles.logoWrap,
              {
                transform: [
                  { translateY: meteorTranslateY },
                  { scale: meteorScale },
                ],
                opacity: meteorOpacity,
              },
            ]}
          >
            <View
              style={[
                styles.logoAura,
                {
                  shadowColor: colors.neonCyan,
                  backgroundColor: "rgba(0, 243, 255, 0.15)",
                },
              ]}
            />
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.textWrap,
              {
                transform: [{ translateY: meteorTranslateY }],
                opacity: meteorOpacity,
              },
            ]}
          >
            <Text style={styles.brandTitle}>CYBERTECH</Text>
            <Text style={styles.brandSubtitle}>HUNTER ACADEMY</Text>
          </Animated.View>
        </View>

        {/* Flash Overlay */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashOpacity,
            },
          ]}
          pointerEvents="none"
        />

        {/* Bottom System Status Text */}
        <Animated.View
          style={[
            styles.statusWrap,
            {
              opacity: stage === "exit" ? 0 : statusPulse,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.statusText}>
            {stage === "meteor"
              ? "INITIALIZING SYSTEM..."
              : stage === "impact"
              ? "CONNECTING TO ACADEMY..."
              : "ARISE, HUNTER..."}
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    backgroundColor: "#07090e",
    elevation: 999999,
  },
  shakeContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  logoWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoAura: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 12,
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  textWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 4,
    textShadowColor: colors.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  brandSubtitle: {
    fontFamily: fonts.display,
    fontSize: 12,
    fontWeight: "700",
    color: colors.neonCyan,
    letterSpacing: 4,
    marginTop: 6,
  },
  shockwaveRing: {
    position: "absolute",
    top: SCREEN_HEIGHT / 2 - 120,
    left: SCREEN_WIDTH / 2 - 120,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    pointerEvents: "none",
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
  },
  statusWrap: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 48 : 36,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 2.5,
  },
});
