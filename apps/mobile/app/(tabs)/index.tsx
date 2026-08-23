import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Zap,
  Crown,
  BookOpen,
  ChevronRight,
  Swords,
  Shield,
  Bell,
  X,
  Flame,
  CheckCircle2,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { useCatalog, useIntroVideo } from "@/hooks/useCourses";
import { useHunterStats } from "@/hooks/useHunterStats";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: catalog, isLoading: catalogLoading, refetch: refetchCatalog } = useCatalog();
  const { data: stats, refetch: refetchStats } = useHunterStats(isAuthenticated);
  const { data: introVideo, refetch: refetchIntro } = useIntroVideo();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    refetch: refetchNotifs,
  } = useNotifications(isAuthenticated);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCatalog(),
        refetchStats?.(),
        refetchIntro?.(),
        refetchNotifs?.(),
      ]);
    } catch (err) {
      console.warn("Pull to refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const glowOpacity = useSharedValue(0.4);
  const textScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
      -1,
      true
    );
    textScale.value = withRepeat(
      withSequence(withTiming(1.02, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const animatedHeroTitle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: glowOpacity.value + 0.5,
  }));

  const player = useVideoPlayer(
    introVideo?.videoUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 
    player => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.neonCyan}
            colors={[colors.neonCyan, colors.neonPurple]}
          />
        }
      >
        {/* ── Hero Banner ── */}
        <View>
          <LinearGradient
            colors={[colors.surface2, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Decorative neon line */}
            <View style={styles.neonLineTop} />

            <View style={styles.heroTop}>
              <View style={styles.heroIconBox}>
                <CyberTechLogo size="sm" showText={false} />
              </View>
              <View style={styles.heroText}>
                <View style={styles.heroBrandRow}>
                  <Text style={styles.heroBrand}>CYBER TECH</Text>
                  <View style={styles.academyPill}>
                    <Text style={styles.academyPillText}>ACADEMY</Text>
                  </View>
                </View>
                <Text style={styles.heroSub}>
                  {user ? `Hunter ${user.name.split(" ")[0]} • Level Up` : "Unleash Your Inner Hunter"}
                </Text>
              </View>

              {/* Notification Bell */}
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => setNotifModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Bell color={colors.neonAmber} size={20} />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Intro Video */}
            <View style={styles.videoContainer}>
              <VideoView
                style={styles.videoPlayer}
                player={player}
                nativeControls={true}
                contentFit="contain"
                fullscreenOptions={{ enable: true }}
                surfaceType="surfaceView"
              />
              <View style={styles.videoOverlay}>
                <Text style={styles.videoTitle}>{introVideo?.title ?? "Welcome to the Academy"}</Text>
              </View>
            </View>

            {/* Hunter Stats Bar — mirrors web HunterStatsBar exactly */}
            {isAuthenticated && stats && (
              <TouchableOpacity
                style={styles.statsContainer}
                activeOpacity={0.9}
                onPress={() => router.push("/ranks" as any)}
              >
                {/* Rank badge */}
                <View style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankLetter}>{stats.rankLetter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>{stats.rankName}</Text>
                    <Text style={styles.expLabel}>EXP: {stats.expTotal.toLocaleString()} • Tap for guide</Text>
                  </View>
                  <View style={styles.streakBox}>
                    <Flame color={colors.neonAmber} size={16} />
                    <Text style={styles.streakText}>
                      {stats.streak}d streak
                    </Text>
                  </View>
                </View>

                {/* EXP Bar */}
                <ProgressBar
                  value={(stats.expCurrent / stats.expMax) * 100}
                  color={colors.neonPurple}
                  label={`EXP  ${stats.expCurrent} / ${stats.expMax}`}
                  height={8}
                />
                {/* HP / Focus */}
                <ProgressBar
                  value={stats.focusPct}
                  color={colors.neonCyan}
                  label={`HP  Focus ${stats.focusPct}%`}
                  height={6}
                />
                {/* MP / Streak */}
                <ProgressBar
                  value={stats.mpPercent}
                  color={colors.neonLime}
                  label={`MP  Streak ${stats.streak > 0 ? `🔥 ${stats.streak}d` : `${stats.mpPercent}%`}`}
                  height={6}
                />
              </TouchableOpacity>
            )}

            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaBtnText}>⚡ Begin Your Journey</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* ── Full Courses ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Crown color={colors.neonAmber} size={18} />
              <Text style={styles.sectionTitle}>Full Courses</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/courses")} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight color={colors.neonPurple} size={14} />
            </TouchableOpacity>
          </View>

          {catalogLoading ? (
            <FlatList
              horizontal
              data={[1, 2, 3]}
              renderItem={() => <SkeletonCard style={styles.courseCardSkeleton} />}
              keyExtractor={(i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <FlatList
              horizontal
              data={catalog?.fullCourses ?? []}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.courseCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(tabs)/courses/${item.slug}` as any)}
                >
                  <View style={styles.courseThumb}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} />
                    ) : (
                      <LinearGradient
                        colors={[colors.neonPurple + "40", colors.neonCyan + "20"]}
                        style={styles.thumbGrad}
                      >
                        <BookOpen color={colors.neonPurple} size={32} />
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.courseInfo}>
                    <Badge label={item.category.name} variant="purple" />
                    <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.courseMeta}>
                      <Text style={styles.courseLessons}>{item.lessons.length} lessons</Text>
                      <Text style={styles.coursePrice}>
                        {item.price === 0 ? "Free" : `₹${item.price.toLocaleString()}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No courses available yet.</Text>
              }
            />
          )}
        </View>

        {/* ── Module Courses (Hunter Pass) ── */}
        {((catalog?.moduleCourses?.length ?? 0) > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Shield color={colors.neonCyan} size={18} />
                <Text style={styles.sectionTitle}>Hunter Pass Modules</Text>
              </View>
            </View>
            <View style={styles.moduleGrid}>
              {catalog?.moduleCourses?.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.courseCard, styles.moduleCard]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(tabs)/courses/${item.slug}` as any)}
                >
                  <View style={styles.courseThumb}>
                    {item.thumbnail ? (
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.thumbImg}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.neonCyan + "30", colors.neonLime + "20"]}
                        style={styles.thumbGrad}
                      >
                        <Swords color={colors.neonCyan} size={28} />
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.courseInfo}>
                    <Badge label="Module" variant="cyan" />
                    <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.coursePrice}>
                      {item.price === 0 ? "Free" : `₹${item.price.toLocaleString()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* ── Notification Modal / Bottom Sheet ── */}
      <Modal
        visible={notifModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Bell color={colors.neonAmber} size={20} />
                <Text style={styles.modalTitle}>Academy Alerts</Text>
                {unreadCount > 0 && (
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={() => markAllAsRead()}>
                    <Text style={styles.markAllText}>Mark read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setNotifModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <X color={colors.mutedForeground} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Bell color={colors.mutedForeground} size={48} opacity={0.3} />
                <Text style={styles.notifEmptyTitle}>All caught up!</Text>
                <Text style={styles.notifEmptySub}>
                  New courses, certifications, purchases, and support updates will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.notifList}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.notifItem,
                      !item.read && styles.notifItemUnread,
                    ]}
                  >
                    <View style={styles.notifItemHeader}>
                      <Text
                        style={[
                          styles.notifItemTitle,
                          !item.read && { color: colors.neonAmber },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.notifItemDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.notifItemMessage}>{item.message}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const CARD_W = SCREEN_W * 0.7;

const styles = StyleSheet.create({
  scroll: { paddingBottom: 110 },

  // Hero
  heroBanner: {
    margin: spacing[4],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.neonPurple + "40",
    padding: spacing[5],
    overflow: "hidden",
    gap: spacing[4],
  },
  neonLineTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.neonPurple + "80",
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: "rgba(0, 243, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 243, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroText: { flex: 1, gap: 2 },
  heroBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroBrand: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    letterSpacing: 2,
    fontWeight: "bold",
  },
  academyPill: {
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.5)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  academyPillText: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: colors.neonPurple,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.neonAmber,
    borderRadius: radii.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
  },

  // Video
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neonCyan + "40",
    marginTop: spacing[2],
    backgroundColor: colors.surface2,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  videoTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.white,
    letterSpacing: 1,
  },

  // Stats
  statsContainer: { gap: spacing[2] },
  rankRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[2] },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.neonPurpleAlpha20,
    borderWidth: 1,
    borderColor: colors.neonPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  rankLetter: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.neonPurple },
  rankName: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.foreground, letterSpacing: 1 },
  expLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  streakBox: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.neonAmberAlpha20,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.neonAmber + "60",
  },
  streakText: { fontFamily: fonts.sans, fontSize: fontSizes.xs, color: colors.neonAmber },

  // CTA
  ctaBtn: {
    backgroundColor: colors.neonPurple,
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
    alignItems: "center",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  ctaBtnText: { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.white, letterSpacing: 2 },

  // Sections
  section: { marginTop: spacing[6] },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  sectionTitle: { fontFamily: fonts.display, fontSize: fontSizes.base, color: colors.foreground, letterSpacing: 2 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.neonPurple },
  horizontalList: { paddingHorizontal: spacing[4], gap: spacing[4] },

  // Course Card
  courseCard: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing[4],
    gap: spacing[4],
    justifyContent: "space-between",
  },
  moduleCard: {
    width: "47%", // two columns
    borderColor: colors.neonCyan + "40",
    shadowColor: colors.neonCyan,
  },
  courseCardSkeleton: { width: CARD_W },
  courseThumb: { height: 140 },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  courseInfo: { padding: spacing[4], gap: spacing[2] },
  courseTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.foreground,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  courseMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  courseLessons: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  coursePrice: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.neonAmber, letterSpacing: 1 },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    padding: spacing[4],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: "80%",
    paddingBottom: spacing[6],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    letterSpacing: 1,
  },
  modalBadge: {
    backgroundColor: colors.neonAmberAlpha20,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.neonAmber,
  },
  modalBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonAmber,
    fontWeight: "bold",
  },
  markAllText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    textDecorationLine: "underline",
  },
  closeBtn: {
    padding: 4,
  },
  notifList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  notifItem: {
    backgroundColor: colors.surface2,
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  notifItemUnread: {
    borderColor: colors.neonAmber + "60",
    backgroundColor: colors.neonAmberAlpha20 + "20",
  },
  notifItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifItemTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    fontWeight: "bold",
    flex: 1,
  },
  notifItemDate: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  notifItemMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  notifEmpty: {
    padding: spacing[8],
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  notifEmptyTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    letterSpacing: 1,
  },
  notifEmptySub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
});
