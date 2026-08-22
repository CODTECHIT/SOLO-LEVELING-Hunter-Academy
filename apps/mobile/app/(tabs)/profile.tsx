import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Mail, Phone, Shield, LogOut, Edit2, Check, X } from "lucide-react-native";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChevronRight, CreditCard, HelpCircle, LifeBuoy, Tag } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useHunterStats } from "@/hooks/useHunterStats";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loadUser } = useAuthStore();
  const { data: stats } = useHunterStats(isAuthenticated);
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/users/profile", { name: name || undefined, phone: phone || undefined });
      await loadUser();
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          qc.clear();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.neonPurple} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen scroll>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Badge label={stats?.rankName ?? "Novice Hunter"} variant="purple" />
          </View>
        </View>

        {/* Hunter Status Window */}
        {stats && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/ranks" as any)}
            style={styles.statsWrapper}
          >
            <LinearGradient
              colors={["rgba(168, 85, 247, 0.18)", "rgba(0, 243, 255, 0.08)", "#070a14"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsCard}
            >
              {/* Status Header */}
              <View style={styles.statsTitleRow}>
                <View style={styles.statsHeaderLeft}>
                  <Shield color={colors.neonPurple} size={18} />
                  <Text style={styles.statsTitle}>STATUS WINDOW</Text>
                </View>
                <View style={styles.rankBadgeContainer}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankLetter}>{stats.rankLetter}</Text>
                  </View>
                  <Text style={styles.rankGuideChip}>Rank Guide ➔</Text>
                </View>
              </View>

              {/* 4 Cyberpunk Stat Pods */}
              <View style={styles.statsGrid}>
                <View style={styles.statPod}>
                  <Text style={styles.statVal}>{stats.coursesTaken}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statPod}>
                  <Text style={styles.statVal}>{stats.lessonsCompleted}</Text>
                  <Text style={styles.statLabel}>Lessons</Text>
                </View>
                <View style={styles.statPod}>
                  <Text style={[styles.statVal, { color: colors.neonAmber }]}>
                    🔥 {stats.streak}d
                  </Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statPod}>
                  <Text style={[styles.statVal, { color: colors.neonCyan }]}>
                    {stats.expTotal > 9999 ? `${(stats.expTotal / 1000).toFixed(1)}k` : stats.expTotal}
                  </Text>
                  <Text style={styles.statLabel}>EXP</Text>
                </View>
              </View>

              {/* Status Gauges */}
              <View style={styles.bars}>
                <ProgressBar
                  value={(stats.expCurrent / stats.expMax) * 100}
                  color={colors.neonPurple}
                  label={`EXP LVL • ${stats.expCurrent}/${stats.expMax}`}
                  showPercent
                  height={6}
                />
                <ProgressBar
                  value={stats.focusPct}
                  color={colors.neonCyan}
                  label="HP FOCUS • COURSE ACCURACY"
                  showPercent
                  height={6}
                />
                <ProgressBar
                  value={stats.mpPercent}
                  color={colors.neonLime}
                  label={`MP STREAK • ${stats.streak} DAYS ACTIVE`}
                  showPercent
                  height={6}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Profile info */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => { setEditing(true); setName(user.name); setPhone(user.phone ?? ""); }}>
                <Edit2 color={colors.neonPurple} size={16} />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditing(false)}>
                  <X color={colors.destructive} size={16} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={colors.neonLime} size={14} /> : <Check color={colors.neonLime} size={16} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Input label="Name" value={name} onChangeText={setName} />
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 9999999999"
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <User color={colors.neonCyan} size={16} />
                <Text style={styles.infoText}>{user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Mail color={colors.neonPurple} size={16} />
                <Text style={styles.infoText}>{user.email}</Text>
              </View>
              {user.phone && (
                <View style={styles.infoRow}>
                  <Phone color={colors.neonAmber} size={16} />
                  <Text style={styles.infoText}>{user.phone}</Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* More Options (Refunds Removed) */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More</Text>
          </View>
          <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/ranks" as any)}>
              <View style={styles.menuItemLeft}>
                <Shield color={colors.neonPurple} size={20} />
                <Text style={styles.menuItemText}>Hunter Rank Guide</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/purchases")}>
              <View style={styles.menuItemLeft}>
                <CreditCard color={colors.neonCyan} size={20} />
                <Text style={styles.menuItemText}>Purchases & Invoices</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/pricing")}>
              <View style={styles.menuItemLeft}>
                <Tag color={colors.neonLime} size={20} />
                <Text style={styles.menuItemText}>Pricing & Plans</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/faq")}>
              <View style={styles.menuItemLeft}>
                <HelpCircle color={colors.neonPurple} size={20} />
                <Text style={styles.menuItemText}>FAQ</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/support")}>
              <View style={styles.menuItemLeft}>
                <LifeBuoy color={colors.foreground} size={20} />
                <Text style={styles.menuItemText}>Help & Live Support</Text>
              </View>
              <ChevronRight color={colors.mutedForeground} size={16} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Sign Out */}
        <Button
          label="Sign Out"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
          style={styles.logoutBtn}
        />

        {/* Brand Footer */}
        <View style={styles.brandFooter}>
          <CyberTechLogo size="sm" horizontal showText />
          <Text style={styles.brandCopyright}>
            © 2026 Cyber Tech Academy — Arise, Hunter.
          </Text>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing[4], gap: spacing[5], paddingBottom: 110 },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[5],
    paddingVertical: spacing[4],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.neonPurpleAlpha20,
    borderWidth: 2,
    borderColor: colors.neonPurple,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  avatarText: { fontFamily: fonts.display, fontSize: fontSizes["2xl"], color: colors.neonPurple },
  avatarInfo: { gap: spacing[2] },
  userName: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.foreground, letterSpacing: 2 },

  statsWrapper: {
    borderRadius: radii.xl,
    overflow: "hidden",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  statsCard: {
    padding: spacing[4],
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.4)",
    backgroundColor: "#070a14",
  },
  statsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  statsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  statsTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    letterSpacing: 2,
    fontWeight: "bold",
  },
  rankBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  rankPill: {
    backgroundColor: "rgba(168, 85, 247, 0.25)",
    borderWidth: 1,
    borderColor: colors.neonPurple,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankLetter: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: colors.neonPurple,
    fontWeight: "bold",
  },
  rankGuideChip: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statPod: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: 4,
  },
  statVal: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bars: { gap: spacing[3] },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing[4] },
  sectionTitle: { fontFamily: fonts.display, fontSize: fontSizes.sm, color: colors.foreground, letterSpacing: 2 },
  editActions: { flexDirection: "row", gap: spacing[3] },
  editForm: { gap: spacing[4] },
  infoList: { gap: spacing[3] },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  infoText: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.foreground },

  menuList: { gap: spacing[4] },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing[2] },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  menuItemText: { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.foreground },

  logoutBtn: { marginTop: spacing[2] },
  brandFooter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  brandCopyright: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
