import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ArrowLeft, CheckCircle2, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function PricingScreen() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Pricing & Plans</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choose the right path for your journey</Text>
        
        {/* Hunter Pass (Monthly) */}
        <Card style={styles.pricingCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Hunter Pass</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>₹</Text>
              <Text style={styles.priceValue}>499</Text>
              <Text style={styles.priceDuration}>/mo</Text>
            </View>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Access to all Module Courses</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Daily challenge access</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonCyan} size={18} />
              <Text style={styles.featureText}>Community forum access</Text>
            </View>
          </View>

          <Button label="Subscribe Now" onPress={() => {}} style={{ marginTop: spacing[4] }} />
        </Card>

        {/* Masterclass (One-time) */}
        <LinearGradient
          colors={[colors.neonPurple + "30", colors.background]}
          style={styles.premiumCard}
        >
          <View style={styles.popularBadge}>
            <Zap color={colors.background} size={12} />
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
          
          <View style={styles.planHeader}>
            <Text style={styles.planNamePremium}>Full Masterclasses</Text>
            <Text style={styles.premiumDesc}>Pay once, own forever</Text>
          </View>
          
          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>Lifetime access to purchased course</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>Verifiable certificate of completion</Text>
            </View>
            <View style={styles.featureRow}>
              <CheckCircle2 color={colors.neonPurple} size={18} />
              <Text style={styles.featureText}>1-on-1 Mentorship (Select courses)</Text>
            </View>
          </View>

          <Button 
            label="Browse Courses" 
            variant="primary"
            onPress={() => router.push("/(tabs)/courses")} 
            style={{ marginTop: spacing[4] }} 
          />
        </LinearGradient>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  backBtn: {
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginBottom: spacing[6],
    textAlign: "center",
  },
  pricingCard: {
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  premiumCard: {
    padding: spacing[5],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.neonPurple,
    marginBottom: spacing[6],
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radii.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularText: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: colors.background,
    letterSpacing: 1,
  },
  planHeader: {
    marginBottom: spacing[5],
    alignItems: "center",
  },
  planName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  planNamePremium: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.neonPurple,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  premiumDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  priceSymbol: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.mutedForeground,
  },
  priceValue: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.foreground,
  },
  priceDuration: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginLeft: 2,
  },
  featuresList: {
    gap: spacing[3],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
});
