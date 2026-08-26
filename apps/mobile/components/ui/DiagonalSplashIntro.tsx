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
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Line,
  ClipPath,
  Polygon,
  G,
} from "react-native-svg";
import { colors, fonts } from "@/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DiagonalSplashIntroProps {
  onFinish?: () => void;
}

export function DiagonalSplashIntro({ onFinish }: DiagonalSplashIntroProps) {
  const [stage, setStage] = useState<"meteor" | "impact" | "crack" | "split" | "done">("meteor");

  // Animation values
  const meteorScale = useRef(new Animated.Value(2.2)).current;
  const meteorOpacity = useRef(new Animated.Value(0)).current;
  const meteorTranslateY = useRef(new Animated.Value(-120)).current;

  const shakeTranslateX = useRef(new Animated.Value(0)).current;
  const shakeTranslateY = useRef(new Animated.Value(0)).current;

  const shockwaveScale1 = useRef(new Animated.Value(0.1)).current;
  const shockwaveOpacity1 = useRef(new Animated.Value(0)).current;
  const shockwaveScale2 = useRef(new Animated.Value(0.1)).current;
  const shockwaveOpacity2 = useRef(new Animated.Value(0)).current;

  const flashOpacity = useRef(new Animated.Value(0)).current;
  const beamOpacity = useRef(new Animated.Value(0)).current;

  const topTranslateX = useRef(new Animated.Value(0)).current;
  const topTranslateY = useRef(new Animated.Value(0)).current;
  const topRotate = useRef(new Animated.Value(0)).current;
  const topOpacity = useRef(new Animated.Value(1)).current;

  const bottomTranslateX = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(0)).current;
  const bottomRotate = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(1)).current;

  const statusPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Pulse status text
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 1. Stage: Meteor entrance (0ms - 750ms)
    Animated.parallel([
      Animated.timing(meteorScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(meteorOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(meteorTranslateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Stage: Impact Shockwave & Flash (750ms)
    const tImpact = setTimeout(() => {
      setStage("impact");

      // Flash
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.9,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // Screen Shake
      Animated.sequence([
        Animated.timing(shakeTranslateX, { toValue: 9, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: -9, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateY, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: 5, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateY, { toValue: -5, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateX, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeTranslateY, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();

      // Shockwave Ring 1
      shockwaveOpacity1.setValue(1);
      Animated.parallel([
        Animated.timing(shockwaveScale1, {
          toValue: 2.8,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveOpacity1, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]).start();

      // Shockwave Ring 2
      setTimeout(() => {
        shockwaveOpacity2.setValue(0.9);
        Animated.parallel([
          Animated.timing(shockwaveScale2, {
            toValue: 3.2,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity2, {
            toValue: 0,
            duration: 650,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);
    }, 750);

    // 3. Stage: Laser Crack Line (1150ms)
    const tCrack = setTimeout(() => {
      setStage("crack");
      Animated.timing(beamOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Slight pre-split crack shift
      Animated.parallel([
        Animated.timing(topTranslateX, { toValue: -4, duration: 250, useNativeDriver: true }),
        Animated.timing(topTranslateY, { toValue: -4, duration: 250, useNativeDriver: true }),
        Animated.timing(bottomTranslateX, { toValue: 4, duration: 250, useNativeDriver: true }),
        Animated.timing(bottomTranslateY, { toValue: 4, duration: 250, useNativeDriver: true }),
      ]).start();
    }, 1150);

    // 4. Stage: Diagonal Split Separation (1600ms)
    const tSplit = setTimeout(() => {
      setStage("split");

      Animated.parallel([
        // Top-Right half slides UP-RIGHT
        Animated.timing(topTranslateX, {
          toValue: SCREEN_WIDTH * 0.95,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(topTranslateY, {
          toValue: -SCREEN_HEIGHT * 0.85,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(topRotate, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(topOpacity, {
          toValue: 0,
          duration: 550,
          delay: 100,
          useNativeDriver: true,
        }),

        // Bottom-Left half slides DOWN-LEFT
        Animated.timing(bottomTranslateX, {
          toValue: -SCREEN_WIDTH * 0.95,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bottomTranslateY, {
          toValue: SCREEN_HEIGHT * 0.85,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bottomRotate, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(bottomOpacity, {
          toValue: 0,
          duration: 550,
          delay: 100,
          useNativeDriver: true,
        }),

        // Fade laser beam
        Animated.timing(beamOpacity, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1600);

    // 5. Complete & Unmount (2350ms)
    const tDone = setTimeout(() => {
      setStage("done");
      pulseLoop.stop();
      if (onFinish) {
        onFinish();
      }
    }, 2350);

    return () => {
      clearTimeout(tImpact);
      clearTimeout(tCrack);
      clearTimeout(tSplit);
      clearTimeout(tDone);
      pulseLoop.stop();
    };
  }, []);

  if (stage === "done") {
    return null;
  }

  // Exact matching diagonal coordinates: (0, 58% H) to (W, 42% H)
  const y1 = SCREEN_HEIGHT * 0.58;
  const y2 = SCREEN_HEIGHT * 0.42;

  const topPolygonPoints = `0,0 ${SCREEN_WIDTH},0 ${SCREEN_WIDTH},${y2} 0,${y1}`;
  const bottomPolygonPoints = `0,${y1} ${SCREEN_WIDTH},${y2} ${SCREEN_WIDTH},${SCREEN_HEIGHT} 0,${SCREEN_HEIGHT}`;

  const topRotateInterpolation = topRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "4deg"],
  });

  const bottomRotateInterpolation = bottomRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-4deg"],
  });

  // Render centered logo and typography inside each split half
  const renderBrandedContent = (glowColor: string) => (
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
              shadowColor: glowColor,
              backgroundColor: glowColor === colors.neonCyan ? "rgba(0, 243, 255, 0.2)" : "rgba(168, 85, 247, 0.2)",
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
  );

  return (
    <View style={styles.fullscreenContainer} pointerEvents={stage === "split" ? "none" : "auto"}>
      {/* Container with shake animation during impact */}
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
        {/* Top-Right Half (Svg Clipped Polygon) */}
        <Animated.View
          style={[
            styles.splitHalfLayer,
            {
              transform: [
                { translateX: topTranslateX },
                { translateY: topTranslateY },
                { rotate: topRotateInterpolation },
              ],
              opacity: topOpacity,
            },
          ]}
        >
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <ClipPath id="topClip">
                <Polygon points={topPolygonPoints} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#topClip)">
              {/* Dark cyber background */}
              <Polygon points={`0,0 ${SCREEN_WIDTH},0 ${SCREEN_WIDTH},${SCREEN_HEIGHT} 0,${SCREEN_HEIGHT}`} fill="#07090e" />
            </G>
          </Svg>
          {/* Top Half Content */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {renderBrandedContent(colors.neonPurple)}
          </View>
        </Animated.View>

        {/* Bottom-Left Half (Svg Clipped Polygon) */}
        <Animated.View
          style={[
            styles.splitHalfLayer,
            {
              transform: [
                { translateX: bottomTranslateX },
                { translateY: bottomTranslateY },
                { rotate: bottomRotateInterpolation },
              ],
              opacity: bottomOpacity,
            },
          ]}
        >
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <ClipPath id="bottomClip">
                <Polygon points={bottomPolygonPoints} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#bottomClip)">
              {/* Dark cyber background */}
              <Polygon points={`0,0 ${SCREEN_WIDTH},0 ${SCREEN_WIDTH},${SCREEN_HEIGHT} 0,${SCREEN_HEIGHT}`} fill="#07090e" />
            </G>
          </Svg>
          {/* Bottom Half Content */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {renderBrandedContent(colors.neonCyan)}
          </View>
        </Animated.View>

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

        {/* Diagonal Laser Crack Light Beam */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: beamOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="crackBeamGrad" x1="0%" y1="58%" x2="100%" y2="42%">
                <Stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
                <Stop offset="20%" stopColor="#00f3ff" stopOpacity="1" />
                <Stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <Stop offset="80%" stopColor="#a855f7" stopOpacity="1" />
                <Stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Outer Glow Laser */}
            <Line
              x1="0"
              y1={y1}
              x2={SCREEN_WIDTH}
              y2={y2}
              stroke="url(#crackBeamGrad)"
              strokeWidth="10"
            />
            {/* Core White Laser Streak */}
            <Line
              x1="0"
              y1={y1}
              x2={SCREEN_WIDTH}
              y2={y2}
              stroke="#ffffff"
              strokeWidth="3"
            />
          </Svg>
        </Animated.View>

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
              opacity: stage === "split" ? 0 : statusPulse,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.statusText}>
            {stage === "meteor"
              ? "METEORIC GATE DESCENDING..."
              : stage === "impact" || stage === "crack"
              ? "FRACTURING SYSTEM BARRIER..."
              : "ARISE, HUNTER..."}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
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
  },
  splitHalfLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  brandContainer: {
    flex: 1,
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
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
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
