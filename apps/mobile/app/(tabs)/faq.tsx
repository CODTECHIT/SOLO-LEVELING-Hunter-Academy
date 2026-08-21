import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation } from "react-native";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const faqs = [
  {
    category: "General",
    items: [
      { q: "What is Cyber Tech Academy?", a: "We provide industry-standard courses and tools for modern hunters to level up their skills in web development, mobile apps, and data science." },
      { q: "Do I get a certificate?", a: "Yes! Every full course you complete grants you a verifiable completion certificate." }
    ]
  },
  {
    category: "Account & Access",
    items: [
      { q: "How long do I have access?", a: "Most full courses grant lifetime access. Modules via the Hunter Pass may expire based on your subscription." },
      { q: "Can I use multiple devices?", a: "Yes, you can log in on both the web application and the mobile app to sync your progress." }
    ]
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods do you accept?", a: "We accept all major credit cards, UPI, and internet banking via our secure Razorpay integration." },
      { q: "Do you offer refunds?", a: "Yes, we have a 7-day money-back guarantee for most full courses if you have watched less than 20% of the content." }
    ]
  }
];

export default function FAQScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (q: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === q ? null : q);
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Frequently Asked Questions</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {faqs.map((group, i) => (
          <View key={i} style={styles.group}>
            <Text style={styles.groupTitle}>{group.category}</Text>
            {group.items.map((item, j) => (
              <Card key={j} style={styles.faqCard}>
                <TouchableOpacity style={styles.qRow} onPress={() => toggle(item.q)} activeOpacity={0.7}>
                  <Text style={styles.qText}>{item.q}</Text>
                  {expanded === item.q ? (
                    <ChevronUp color={colors.neonPurple} size={20} />
                  ) : (
                    <ChevronDown color={colors.mutedForeground} size={20} />
                  )}
                </TouchableOpacity>
                {expanded === item.q && (
                  <View style={styles.aBox}>
                    <Text style={styles.aText}>{item.a}</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        ))}
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
    paddingBottom: 110,
  },
  group: {
    marginBottom: spacing[6],
  },
  groupTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonCyan,
    marginBottom: spacing[3],
    letterSpacing: 1,
  },
  faqCard: {
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  qRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  aBox: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  aText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
});
