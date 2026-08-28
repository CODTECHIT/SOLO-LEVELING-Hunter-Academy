import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Layers,
  Trophy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function PricingScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  return (
    <SafeScreen>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
          <ArrowLeft color={colors.foreground} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title} numberOfLines={1}>
            Pricing & Plans
          </Text>
          <Text style={styles.subtitle}>Choose your Hunter learning pathway</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.neonCyan}
            colors={[colors.neonCyan, colors.neonPurple]}
          />
        }
      >
        {/* Guild Pathway Hero Banner */}
        <LinearGradient
          colors={["rgba(168, 85, 247, 0.15)", "rgba(0, 243, 255, 0.1)", "#070a14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBadge}>
            <Sparkles color={colors.neonCyan} size={12} />
            <Text style={styles.heroBadgeText}>HUNTER GUILD ARSENAL</Text>
          </View>
          <Text style={styles.heroTitle}>
            One Topic. <Text style={{ color: colors.neonCyan }}>One New Power.</Text>
          </Text>
          <Text style={styles.heroSub}>
            Level up your engineering combat skills with targeted topic sprints or comprehensive career certifications.
          </Text>
        </LinearGradient>

        {/* Plan 1: Hunter Pass (Module Skill Sprints) */}
        <LinearGradient
          colors={["rgba(0, 243, 255, 0.14)", "rgba(7, 10, 20, 0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cyanPlanCard}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.trackPillCyan}>
              <Layers color={colors.neonCyan} size={12} />
              <Text style={styles.trackPillTextCyan}>TOPIC MODULES</Text>
            </View>
            <View style={styles.priceTagBox}>
              <Text style={styles.priceFromText}>FROM</Text>
              <Text style={styles.priceValCyan}>₹399</Text>
            </View>
          </View>

          <Text style={styles.planTitleCyan}>Hunter Pass Sprint</Text>
          <Text style={styles.planDesc}>
            Targeted, bite-sized skill modules designed for hunters who need a specific superpower — fast.
          </Text>

          <View style={styles.dividerCyan} />

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={16} />
              <Text style={styles.featureText}>1 Full Year of Access with seamless renewal</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={16} />
              <Text style={styles.featureText}>Self-paced tactical video lessons & exercises</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={16} />
              <Text style={styles.featureText}>Offline Sandboxed Download mode in mobile app</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={16} />
              <Text style={styles.featureText}>Topic-focused quizzes & EXP point gains</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cyanActionBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/courses?type=MODULE" as any)}
          >
            <Text style={styles.cyanActionBtnText}>Explore Topic Modules</Text>
            <ArrowRight color="#050810" size={16} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Plan 2: Full Career Masterclasses */}
        <LinearGradient
          colors={["rgba(168, 85, 247, 0.22)", "rgba(10, 8, 24, 0.98)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.purplePlanCard}
        >
          {/* Top Floating Popular Badge */}
          <View style={styles.popularBadge}>
            <Flame color="#050810" size={12} fill="#050810" />
            <Text style={styles.popularText}>MOST POPULAR • S-RANK</Text>
          </View>

          <View style={styles.cardHeaderRow}>
            <View style={styles.trackPillPurple}>
              <Trophy color={colors.neonPurple} size={12} />
              <Text style={styles.trackPillTextPurple}>FULL MASTERCLASS</Text>
            </View>
            <View style={styles.priceTagBox}>
              <Text style={styles.priceFromText}>VALIDITY</Text>
              <Text style={styles.priceValPurple}>365 DAYS</Text>
            </View>
          </View>

          <Text style={styles.planTitlePurple}>Career Awakening Path</Text>
          <Text style={styles.planDesc}>
            Comprehensive, end-to-end disciplines from zero to high-ranking production engineer.
          </Text>

          <View style={styles.dividerPurple} />

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={16} />
              <Text style={styles.featureText}>365 Days Full Course Access (1 Year Validity)</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={16} />
              <Text style={styles.featureText}>Official Verifiable Guild Completion Certificate & PDF</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={16} />
              <Text style={styles.featureText}>Production-scale Capstone Projects for Portfolios</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={16} />
              <Text style={styles.featureText}>Priority Live Chat Support & Guild Discord Community</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.purpleActionBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/courses?type=FULL" as any)}
          >
            <Text style={styles.purpleActionBtnText}>Explore Full Masterclasses</Text>
            <ArrowRight color="#ffffff" size={16} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Security & Authenticity Guarantee Banner */}
        <View style={styles.guaranteeBox}>
          <ShieldCheck color={colors.neonLime} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Official Academy Guarantee</Text>
            <Text style={styles.guaranteeText}>
              Verifiable Certificates • Encrypted HD Streaming • Cross-Device Sync
            </Text>
          </View>
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
    paddingBottom: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    letterSpacing: 0.5,
    fontWeight: "bold",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: 110,
    gap: spacing[4],
  },

  // Hero Banner
  heroBanner: {
    padding: spacing[4],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.2)",
    gap: spacing[2],
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 243, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  heroBadgeText: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonCyan,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
  },
  heroSub: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },

  // Cyan Plan Card
  cyanPlanCard: {
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(0, 243, 255, 0.35)",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  trackPillCyan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  trackPillTextCyan: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonCyan,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  priceTagBox: {
    alignItems: "flex-end",
  },
  priceFromText: {
    fontFamily: fonts.sans,
    fontSize: 8,
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
  priceValCyan: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  planTitleCyan: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  planDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginTop: 4,
  },
  dividerCyan: {
    height: 1,
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    marginVertical: spacing[4],
  },
  cyanActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neonCyan,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[2],
    marginTop: spacing[4],
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cyanActionBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: "#050810",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Purple Plan Card
  purplePlanCard: {
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.5)",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    color: "#050810",
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  trackPillPurple: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  trackPillTextPurple: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonPurple,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  priceValPurple: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonPurple,
    fontWeight: "bold",
  },
  planTitlePurple: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  dividerPurple: {
    height: 1,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    marginVertical: spacing[4],
  },
  purpleActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neonPurple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[2],
    marginTop: spacing[4],
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  purpleActionBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Shared Features
  featuresList: {
    gap: spacing[3],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  featureText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.foreground,
    flex: 1,
    lineHeight: 18,
  },

  // Guarantee Box
  guaranteeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
    padding: spacing[4],
    borderRadius: radii.xl,
  },
  guaranteeTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: colors.neonLime,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  guaranteeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
