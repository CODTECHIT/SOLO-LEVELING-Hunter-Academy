import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Shield,
  Zap,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  ChevronDown,
  Trophy,
  Sliders,
} from "lucide-react-native";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { useAuthStore } from "@/store/authStore";
import { useHunterStats } from "@/hooks/useHunterStats";

const RANK_TIERS = [
  {
    letter: "E",
    name: "Novice Hunter",
    range: "0 – 999 EXP",
    color: "#94a3b8",
    badgeBg: "rgba(148, 163, 184, 0.15)",
    desc: "The awakening phase. Foundational knowledge & initial combat training.",
    perks: [
      "Access to beginner dungeon lessons",
      "Standard community chat",
      "Live EXP & progress tracking",
    ],
  },
  {
    letter: "D",
    name: "Initiate Hunter",
    range: "1,000 – 2,999 EXP",
    color: colors.neonCyan,
    badgeBg: colors.neonCyanAlpha20,
    desc: "First dungeon raids completed. You grasp core architectures and practical setups.",
    perks: [
      "D-Rank insignia on certificates",
      "Unlocked Academy leaderboards",
      "Access to intermediate tracks",
    ],
  },
  {
    letter: "C",
    name: "Adept Hunter",
    range: "3,000 – 6,999 EXP",
    color: colors.neonLime,
    badgeBg: colors.neonLimeAlpha20,
    desc: "Solid technical mastery. Building real projects and passing timed dungeon exams.",
    perks: [
      "C-Rank badge with elevated ranking",
      "Verified course review highlights",
      "Specialized raid challenges",
    ],
  },
  {
    letter: "B",
    name: "Elite Hunter",
    range: "7,000 – 14,999 EXP",
    color: colors.neonAmber,
    badgeBg: colors.neonAmberAlpha20,
    desc: "High-tier dungeon conqueror. Capable of architecting complex distributed systems.",
    perks: [
      "Gold certificate watermark",
      "Priority customer ticket support",
      "Private guild masterclass invites",
    ],
  },
  {
    letter: "A",
    name: "Veteran Hunter",
    range: "15,000 – 29,999 EXP",
    color: colors.neonPurple,
    badgeBg: colors.neonPurpleAlpha20,
    desc: "Master level practitioner. Guides other hunters and conquers demanding exams.",
    perks: [
      "A-Rank Veteran profile spotlight",
      "Exclusive 1-on-1 mentorship",
      "Top 5% Academy leaderboards",
    ],
  },
  {
    letter: "S",
    name: "Legendary Monarch",
    range: "30,000+ EXP",
    color: "#f43f5e",
    badgeBg: "rgba(244, 63, 94, 0.2)",
    desc: "The absolute pinnacle. Flawless mastery across all dungeon disciplines.",
    perks: [
      "Permanent S-Rank Monarch Seal",
      "Academy Hall of Fame honours",
      "Direct Guild Master career referrals",
    ],
  },
];

const EXP_BREAKDOWN = [
  { icon: BookOpen, title: "Course Enrollment", amount: "+50 EXP", color: colors.neonCyan, desc: "Granted instantly on unlocking any full course or module." },
  { icon: Zap, title: "Lesson Completed", amount: "+25 EXP", color: colors.neonLime, desc: "Awarded automatically per video lesson finished." },
  { icon: Award, title: "100% Certificate", amount: "+200 EXP", color: colors.neonAmber, desc: "Milestone bonus for conquering an entire course syllabus." },
  { icon: Trophy, title: "Passed Quiz", amount: "+50 EXP", color: colors.neonPurple, desc: "Earned by passing a module exam with flying colors." },
];

const FAQS = [
  {
    q: "Does my rank decrease if I take a break?",
    a: "No! Your EXP and rank are permanent. Only your Daily Study Streak (MP) resets if a calendar day is missed.",
  },
  {
    q: "What is HP Focus vs MP Streak?",
    a: "HP Focus measures video watch duration across courses. MP Streak increments every day you study (7 days = 100% Overdrive).",
  },
  {
    q: "Can I jump multiple ranks at once?",
    a: "Yes! As soon as your total EXP crosses the next threshold, your rank immediately upgrades.",
  },
];

export default function RanksScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: stats } = useHunterStats(isAuthenticated);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hunter Rank Guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Status Card (if logged in) */}
        {isAuthenticated && stats && (
          <Card style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View>
                <Text style={styles.userSubtitle}>Current Hunter Rank</Text>
                <Text style={styles.userName}>{user?.name ?? "Hunter"}</Text>
              </View>
              <View style={styles.rankBadgeLarge}>
                <Text style={styles.rankBadgeText}>{stats.rankLetter}</Text>
              </View>
            </View>

            <View style={styles.userStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNum}>{stats.expTotal.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total EXP</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.neonAmber }]}>🔥 {stats.streak}d</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNum, { color: colors.neonLime }]}>{stats.focusPct}%</Text>
                <Text style={styles.statLabel}>Focus HP</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Intro */}
        <View style={styles.introBox}>
          <Shield color={colors.neonCyan} size={24} />
          <Text style={styles.introTitle}>How Hunter Ranks Work</Text>
          <Text style={styles.introText}>
            Every action in the academy grants experience points (EXP). As you acquire more EXP, your Hunter Rank automatically ascends through 6 recognized guild tiers.
          </Text>
        </View>

        {/* 6 Rank Cards */}
        <Text style={styles.sectionHeading}>The 6 Hunter Tiers</Text>
        <View style={styles.tiersList}>
          {RANK_TIERS.map((tier) => (
            <Card key={tier.letter} style={StyleSheet.flatten([styles.tierCard, { borderColor: tier.color + "50" }])}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierLetterBadge, { backgroundColor: tier.badgeBg, borderColor: tier.color }]}>
                  <Text style={[styles.tierLetterText, { color: tier.color }]}>{tier.letter}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={[styles.tierRange, { color: tier.color }]}>{tier.range}</Text>
                </View>
              </View>

              <Text style={styles.tierDesc}>{tier.desc}</Text>

              <View style={styles.perksList}>
                {tier.perks.map((p, i) => (
                  <View key={i} style={styles.perkItem}>
                    <CheckCircle2 color={colors.neonLime} size={14} />
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        {/* EXP Formula Breakdown */}
        <Text style={styles.sectionHeading}>How You Gain EXP</Text>
        <View style={styles.expGrid}>
          {EXP_BREAKDOWN.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} style={styles.expCard}>
                <View style={styles.expHeader}>
                  <View style={[styles.expIconBox, { backgroundColor: item.color + "20", borderColor: item.color }]}>
                    <Icon color={item.color} size={18} />
                  </View>
                  <Text style={[styles.expAmount, { color: item.color }]}>{item.amount}</Text>
                </View>
                <Text style={styles.expTitle}>{item.title}</Text>
                <Text style={styles.expDesc}>{item.desc}</Text>
              </Card>
            );
          })}
        </View>

        {/* HP & MP Overview */}
        <Text style={styles.sectionHeading}>Focus (HP) & Streaks (MP)</Text>
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaTag, { color: colors.neonLime }]}>HP • Focus</Text>
            <Text style={styles.metaDesc}>
              Measures video duration watched across your enrolled courses. Watch lessons thoroughly to reach 100% HP.
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={[styles.metaTag, { color: colors.neonPurple }]}>MP • Streak Mana 🔥</Text>
            <Text style={styles.metaDesc}>
              Increments for every consecutive day you study. 7 consecutive days unlocks full 100% MP Overdrive!
            </Text>
          </View>
        </Card>

        {/* FAQs */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqItem}
              activeOpacity={0.8}
              onPress={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <ChevronDown
                  color={colors.mutedForeground}
                  size={18}
                  style={{ transform: [{ rotate: openFaq === idx ? "180deg" : "0deg" }] }}
                />
              </View>
              {openFaq === idx && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Button */}
        <Button
          label="Explore Courses"
          onPress={() => router.push("/(tabs)/courses")}
          variant="primary"
          fullWidth
          style={{ marginTop: spacing[4], marginBottom: spacing[8] }}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
  },
  userCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.neonPurple + "60",
    borderWidth: 1,
    gap: spacing[3],
  },
  userCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  userName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    fontWeight: "bold",
  },
  rankBadgeLarge: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.neonCyanAlpha20,
    borderColor: colors.neonCyan,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  userStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statCol: {
    alignItems: "center",
  },
  statNum: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  introBox: {
    backgroundColor: colors.surface2,
    padding: spacing[4],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    textAlign: "center",
    gap: spacing[2],
  },
  introTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
    textAlign: "center",
  },
  introText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionHeading: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
    marginTop: spacing[2],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tiersList: {
    gap: spacing[3],
  },
  tierCard: {
    borderWidth: 1,
    gap: spacing[2],
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierLetterBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tierLetterText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    fontWeight: "bold",
  },
  tierName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
  },
  tierRange: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "600",
  },
  tierDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  perksList: {
    gap: 4,
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border + "80",
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  perkText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.foreground,
  },
  expGrid: {
    gap: 10,
  },
  expCard: {
    gap: 4,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expIconBox: {
    padding: 6,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  expAmount: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
  },
  expTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    fontWeight: "bold",
  },
  expDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  metaCard: {
    gap: spacing[3],
  },
  metaRow: {
    gap: 4,
  },
  metaTag: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
  },
  metaDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  metaDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  faqList: {
    gap: spacing[2],
  },
  faqItem: {
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    fontWeight: "bold",
    flex: 1,
    marginRight: spacing[2],
  },
  faqAnswer: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[2],
  },
});
