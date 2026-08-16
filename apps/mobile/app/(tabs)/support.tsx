import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from "react-native";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function SupportScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL("mailto:support@cybertechacademy.com");
  };

  const handleCall = () => {
    Linking.openURL("tel:+919999999999");
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>How can we help you today?</Text>
        
        <Card style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Mail color={colors.neonPurple} size={24} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactDesc}>support@cybertechacademy.com</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={handleCall} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: colors.neonCyan + "20", borderColor: colors.neonCyan }]}>
              <Phone color={colors.neonCyan} size={24} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Call Us</Text>
              <Text style={styles.contactDesc}>Mon-Fri, 9am - 6pm</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: colors.neonLime + "20", borderColor: colors.neonLime }]}>
              <MessageCircle color={colors.neonLime} size={24} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDesc}>Chat with our support team</Text>
            </View>
          </TouchableOpacity>
        </Card>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Average response time: 2-4 hours</Text>
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
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginBottom: spacing[6],
  },
  contactCard: {
    marginBottom: spacing[4],
    padding: spacing[2],
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[2],
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.neonPurpleAlpha20,
    borderWidth: 1,
    borderColor: colors.neonPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    marginBottom: 2,
  },
  contactDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  footer: {
    marginTop: spacing[8],
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
});
