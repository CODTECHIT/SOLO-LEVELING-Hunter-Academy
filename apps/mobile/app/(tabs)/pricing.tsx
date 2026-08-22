import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft, CheckCircle2, Zap, Layers, Trophy, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function PricingScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft color={colors.foreground} size={22} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Pricing & Plans</Text>
          <Text style={styles.subtitle}>Choose your Hunter learning pathway</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Module Track 1: Hunter Pass */}
        <LinearGradient
          colors={["rgba(0, 243, 255, 0.12)", "rgba(10, 10, 26, 0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cyanPlanCard}
        >
          <View style={styles.trackPillCyan}>
            <Layers color={colors.neonCyan} size={12} />
            <Text style={styles.trackPillTextCyan}>MODULE TRACK</Text>
          </View>

          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planNameCyan}>Hunter Pass</Text>
              <Text style={styles.planSubtitle}>Fast-track Skill Sprints & Quests</Text>
            </View>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceSymbol}>₹</Text>
                <Text style={styles.priceValueCyan}>499</Text>
                <Text style={styles.priceDuration}>/mo</Text>
              </View>
              <Text style={styles.billingText}>Cancel anytime</Text>
            </View>
          </View>

          <View style={styles.dividerCyan} />

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Instant access to all Hunter Module Courses</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Daily challenge quests & EXP multipliers</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Community Discord & hunter guild access</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Interactive quizzes & code challenges</Text>
            </View>
          </View>

          <Button
            label="Explore Hunter Modules"
            variant="secondary"
            onPress={() => router.push("/(tabs)/courses?type=MODULE" as any)}
            style={styles.cyanBtn}
          />
        </LinearGradient>

        {/* Module Track 2: Full Masterclasses */}
        <LinearGradient
          colors={["rgba(147, 51, 234, 0.25)", "rgba(20, 10, 35, 0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.purplePlanCard}
        >
          <View style={styles.popularBadge}>
            <Zap color="#000" size={12} fill="#000" />
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>

          <View style={styles.trackPillPurple}>
            <Trophy color={colors.neonPurple} size={12} />
            <Text style={styles.trackPillTextPurple}>CERTIFICATION TRACK</Text>
          </View>

          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planNamePurple}>Full Masterclasses</Text>
              <Text style={styles.planSubtitle}>Comprehensive Career Certifications</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.payOnceTag}>PAY ONCE</Text>
              <Text style={styles.billingTextPurple}>Lifetime Ownership</Text>
            </View>
          </View>

          <View style={styles.dividerPurple} />

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>Lifetime access to entire curriculum & updates</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>Cryptographic verifiable Hunter Certificate</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>Full-scale capstone projects & code portfolio</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>1-on-1 mentor guidance & resume review</Text>
            </View>
          </View>

          <Button
            label="Explore Full Masterclasses"
            variant="primary"
            onPress={() => router.push("/(tabs)/courses?type=FULL" as any)}
            style={styles.purpleBtn}
          />
        </LinearGradient>

        {/* Guarantee Banner */}
        <View style={styles.guaranteeBox}>
          <ShieldCheck color={colors.neonLime} size={20} />
          <Text style={styles.guaranteeText}>
            100% Satisfaction Guarantee • Secure Cloud Access • 24/7 Support
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  content: {
    padding: spacing[4],
    paddingBottom: 110,
    gap: spacing[5],
  },

  // Cyan Card (Hunter Pass)
  cyanPlanCard: {
    padding: spacing[5],
    borderRadius: radii["2xl"],
    borderWidth: 1.5,
    borderColor: "rgba(0, 243, 255, 0.35)",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  trackPillCyan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: "flex-start",
    marginBottom: spacing[3],
  },
  trackPillTextCyan: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonCyan,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planNameCyan: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonCyan,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  planSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceSymbol: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    marginBottom: 4,
  },
  priceValueCyan: {
    fontFamily: fonts.display,
    fontSize: fontSizes["2xl"],
    color: colors.foreground,
    fontWeight: "bold",
  },
  priceDuration: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginBottom: 4,
    marginLeft: 2,
  },
  billingText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  dividerCyan: {
    height: 1,
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    marginVertical: spacing[4],
  },
  cyanBtn: {
    marginTop: spacing[4],
    borderColor: colors.neonCyan,
  },

  // Purple Card (Full Masterclasses)
  purplePlanCard: {
    padding: spacing[5],
    borderRadius: radii["2xl"],
    borderWidth: 1.5,
    borderColor: "rgba(147, 51, 234, 0.5)",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    position: "relative",
    marginTop: spacing[2],
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: spacing[4],
    backgroundColor: colors.neonAmber,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radii.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: colors.neonAmber,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  popularText: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: "#000",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  trackPillPurple: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: "flex-start",
    marginBottom: spacing[3],
  },
  trackPillTextPurple: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonPurple,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  planNamePurple: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  payOnceTag: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.neonPurple,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  billingTextPurple: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  dividerPurple: {
    height: 1,
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    marginVertical: spacing[4],
  },
  purpleBtn: {
    marginTop: spacing[4],
  },

  // Shared Features List
  featuresList: {
    gap: spacing[3],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.foreground,
    flex: 1,
    lineHeight: 18,
  },

  // Guarantee Box
  guaranteeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
    padding: spacing[3],
    borderRadius: radii.xl,
    justifyContent: "center",
  },
  guaranteeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonLime,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
