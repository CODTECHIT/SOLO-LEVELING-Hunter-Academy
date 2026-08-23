import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from "react-native";
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle, Sparkles, BookOpen, ShieldCheck, CreditCard } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  {
    category: "General & Academy",
    icon: Sparkles,
    color: colors.neonCyan,
    items: [
      {
        q: "What is Cyber Tech Academy?",
        a: "Cyber Tech Academy is an elite Hunter-themed learning platform where engineers and developers conquer real-world masterclasses, level up combat skills in code, and earn cryptographic certificates of mastery.",
      },
      {
        q: "Do I receive a verifiable certificate upon completion?",
        a: "Yes! Conquering all dungeon lessons and assessments in a course automatically issues an authenticated, digitally verifiable Cyber Tech Guild Certificate with unique ID and PDF export.",
      },
      {
        q: "Can I download lessons for offline study?",
        a: "Yes! In the mobile app, tap 'Save Offline' on any lesson to store it encrypted in your local device sandbox and watch anywhere without an active internet connection.",
      },
    ],
  },
  {
    category: "Hunter Pass & Courses",
    icon: BookOpen,
    color: colors.neonPurple,
    items: [
      {
        q: "What is the difference between Hunter Pass Modules and Full Paths?",
        a: "Hunter Pass Topic Modules are quick, targeted skill sprints (from ₹399) to learn one specific tool fast. Full Career Masterclasses provide complete end-to-end curriculum, capstones, and lifetime access.",
      },
      {
        q: "How long is my course access valid?",
        a: "Full Masterclass purchases grant lifetime access including all future updates. Module courses remain active for 1 full year with simple one-click renewal.",
      },
      {
        q: "Can I switch between web and mobile devices?",
        a: "Yes! Your account, EXP points, lesson watch progress, and unlocked badges synchronize automatically across the web platform and mobile app in real time.",
      },
    ],
  },
  {
    category: "Billing & Security",
    icon: ShieldCheck,
    color: colors.neonLime,
    items: [
      {
        q: "Which payment options are supported?",
        a: "We support all major payment methods including UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and International Cards via our secure encrypted gateway.",
      },
      {
        q: "Why is screen recording restricted on video playback?",
        a: "To protect intellectual property and proprietary syllabus material, our media player utilizes hardware-level secure window protection across full-screen playback.",
      },
      {
        q: "How do I get help if I get stuck on a coding lesson?",
        a: "You can open a live support ticket directly in the app via Help & Support, or ask questions in the community Hunter Guild discussion channels.",
      },
    ],
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (q: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === q ? null : q);
  };

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
          <ArrowLeft color={colors.foreground} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            Frequently Asked Questions
          </Text>
          <Text style={styles.subtitle}>Answers & Hunter Guild Intelligence</Text>
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
        {faqs.map((group, i) => {
          const IconComp = group.icon;
          return (
            <View key={i} style={styles.group}>
              <View style={styles.groupHeader}>
                <IconComp color={group.color} size={16} />
                <Text style={[styles.groupTitle, { color: group.color }]}>
                  {group.category}
                </Text>
              </View>

              {group.items.map((item, j) => {
                const isItemExpanded = expanded === item.q;
                return (
                  <View
                    key={j}
                    style={[
                      styles.faqCard,
                      isItemExpanded && styles.faqCardExpanded,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.qRow}
                      onPress={() => toggle(item.q)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.qText,
                          isItemExpanded && { color: colors.neonCyan, fontWeight: "600" },
                        ]}
                      >
                        {item.q}
                      </Text>
                      <View style={styles.chevronWrapper}>
                        {isItemExpanded ? (
                          <ChevronUp color={colors.neonCyan} size={18} />
                        ) : (
                          <ChevronDown color={colors.mutedForeground} size={18} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {isItemExpanded && (
                      <View style={styles.aBox}>
                        <Text style={styles.aText}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
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
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
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
    gap: spacing[5],
  },
  group: {
    gap: spacing[2],
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  groupTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  faqCard: {
    backgroundColor: "#070a14",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: spacing[4],
    overflow: "hidden",
  },
  faqCardExpanded: {
    borderColor: "rgba(0, 243, 255, 0.3)",
    backgroundColor: "rgba(7, 10, 20, 0.95)",
  },
  qRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  qText: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
  chevronWrapper: {
    padding: 2,
  },
  aBox: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderLeftWidth: 2,
    borderLeftColor: colors.neonCyan,
    paddingLeft: spacing[3],
  },
  aText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: "#94a3b8",
    lineHeight: 22,
    flexShrink: 1,
  },
});
