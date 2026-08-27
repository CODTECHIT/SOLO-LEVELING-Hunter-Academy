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
  Bot,
  Sparkles,
  Trophy,
  Play,
  Pause,
  Award,
  GraduationCap,
  Compass,
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
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { CourseAssistantModal } from "@/components/ui/CourseAssistantModal";
import { useCatalog, useIntroVideo } from "@/hooks/useCourses";
import { useHunterStats } from "@/hooks/useHunterStats";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W * 0.78, 320);

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
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");

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
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1600 }), withTiming(0.4, { duration: 1600 })),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 1800 }), withTiming(1, { duration: 1800 })),
      -1,
      true
    );
  }, []);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const player = useVideoPlayer(
    introVideo?.videoUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    (p) => {
      p.loop = true;
      p.muted = true;
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
        {/* ── Top Header Navigation Bar ── */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.brandRow}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCrestWrapper}>
              <LinearGradient
                colors={["rgba(0, 243, 255, 0.25)", "rgba(176, 96, 240, 0.15)"]}
                style={styles.avatarCrestGrad}
              >
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </LinearGradient>
              {/* Online status beacon dot */}
              <View style={styles.statusDotBeacon}>
                <View style={styles.statusDotCore} />
              </View>
            </View>

            <View style={styles.brandInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.brandTitleText}>CYBER TECH</Text>
                <Text style={styles.brandTitleAccent}> ACADEMY</Text>
              </View>

              <View style={styles.hunterStatusRow}>
                <Text style={styles.hunterNameText} numberOfLines={1}>
                  {user ? `Hunter ${user.name.split(" ")[0]}` : "Recruit Hunter"}
                </Text>
                <View style={styles.rankPillMini}>
                  <Text style={styles.rankPillText}>
                    {stats?.rankLetter ? `${stats.rankLetter}-RANK` : "ACTIVE"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* AI Shortcut Button */}
            <TouchableOpacity
              style={styles.actionBtnAi}
              onPress={() => {
                setAssistantQuery("");
                setAssistantVisible(true);
              }}
              activeOpacity={0.75}
            >
              <Bot color={colors.neonCyan} size={18} />
              <View style={styles.aiSparkDot} />
            </TouchableOpacity>

            {/* Notification Bell */}
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.actionBtnNotif}
                onPress={() => setNotifModalVisible(true)}
                activeOpacity={0.75}
              >
                <Bell color={colors.neonAmber} size={18} />
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
        </View>

        {/* ── Hero Banner Section ── */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={["#0c1428", "#080d1a", "#050810"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Top decorative neon glow line */}
            <View style={styles.neonAccentLine} />

            <View style={styles.heroContent}>
              {/* Embedded Trailer / Ad Video Player */}
              <View style={styles.videoPlayerBox}>
                <VideoView
                  style={styles.videoPlayer}
                  player={player}
                  nativeControls={true}
                  contentFit="cover"
                  fullscreenOptions={{ enable: true }}
                  surfaceType="surfaceView"
                />
                <View style={styles.videoCaptionBar}>
                  <View style={styles.videoCaptionLeft}>
                    <Play color={colors.neonCyan} size={12} />
                    <Text style={styles.videoCaptionText} numberOfLines={1}>
                      {introVideo?.title || "Academy Masterclasses & Trailer"}
                    </Text>
                  </View>
                  <View style={styles.adLiveBadge}>
                    <Text style={styles.adLiveText}>OFFICIAL TRAILER</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.heroActionRow}>
                <TouchableOpacity
                  style={styles.heroPrimaryBtn}
                  onPress={() => {
                    if (isAuthenticated) {
                      router.push("/(tabs)/my-learning" as any);
                    } else {
                      router.push("/(auth)/login");
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.neonCyan, "#00b4d8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.heroPrimaryBtnGrad}
                  >
                    <Zap color="#050810" size={16} />
                    <Text style={styles.heroPrimaryBtnText}>
                      {isAuthenticated ? "Continue Mission" : "Begin Your Journey"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() => router.push("/(tabs)/courses")}
                  activeOpacity={0.8}
                >
                  <Compass color={colors.neonCyan} size={15} />
                  <Text style={styles.heroSecondaryBtnText}>Explore Tracks</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Hunter Combat HUD / Stats Card (When Logged In) ── */}
        {isAuthenticated && stats && (
          <View style={styles.hudWrapper}>
            <TouchableOpacity
              style={styles.statsCard}
              activeOpacity={0.9}
              onPress={() => router.push("/ranks" as any)}
            >
              <LinearGradient
                colors={["rgba(176, 96, 240, 0.12)", "rgba(0, 243, 255, 0.06)", colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCardGrad}
              >
                {/* HUD Top Bar */}
                <View style={styles.hudTopRow}>
                  <View style={styles.hudRankBadge}>
                    <Text style={styles.hudRankLetter}>{stats.rankLetter || "E"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.hudRankName}>{stats.rankName}</Text>
                      <View style={styles.hudPrestigeBadge}>
                        <Shield color={colors.neonPurple} size={10} />
                        <Text style={styles.hudPrestigeText}>ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.hudExpSub}>
                      {stats.expTotal.toLocaleString()} EXP Accumulated • Tap for Rank Guide
                    </Text>
                  </View>
                  <View style={styles.streakPill}>
                    <Flame color={colors.neonAmber} size={16} />
                    <Text style={styles.streakPillText}>{stats.streak}d</Text>
                  </View>
                </View>

                {/* Progress Gauges */}
                <View style={styles.gaugesContainer}>
                  <ProgressBar
                    value={(stats.expCurrent / (stats.expMax || 100)) * 100}
                    color={colors.neonPurple}
                    label={`EXP Progression: ${stats.expCurrent} / ${stats.expMax}`}
                    height={7}
                  />
                  <View style={styles.gaugesSplit}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar
                        value={stats.focusPct || 0}
                        color={colors.neonCyan}
                        label={`HP Focus: ${stats.focusPct}%`}
                        height={5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ProgressBar
                        value={stats.mpPercent || 0}
                        color={colors.neonLime}
                        label={`MP Streak: ${stats.streak > 0 ? `${stats.streak}d (${stats.mpPercent}%)` : `${stats.mpPercent}%`}`}
                        height={5}
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tactical Quick Actions Matrix ── */}
        <View style={styles.quickMatrixWrapper}>
          {[
            {
              title: "My Courses",
              sub: "Resume Study",
              icon: BookOpen,
              color: colors.neonCyan,
              bg: "rgba(0, 243, 255, 0.08)",
              border: "rgba(0, 243, 255, 0.25)",
              route: "/(tabs)/my-learning",
            },
            {
              title: "Course Catalog",
              sub: "Explore All",
              icon: Compass,
              color: colors.neonPurple,
              bg: "rgba(176, 96, 240, 0.08)",
              border: "rgba(176, 96, 240, 0.25)",
              route: "/(tabs)/courses",
            },
            {
              title: "Hunter Ranks",
              sub: "EXP & Prestige",
              icon: Trophy,
              color: colors.neonAmber,
              bg: "rgba(251, 191, 36, 0.08)",
              border: "rgba(251, 191, 36, 0.25)",
              route: "/ranks",
            },
            {
              title: "AI Teacher",
              sub: "24/7 Q&A",
              icon: Bot,
              color: colors.neonLime,
              bg: "rgba(34, 197, 94, 0.08)",
              border: "rgba(34, 197, 94, 0.25)",
              action: () => {
                setAssistantQuery("");
                setAssistantVisible(true);
              },
            },
          ].map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickTile,
                  { backgroundColor: tile.bg, borderColor: tile.border },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (tile.action) tile.action();
                  else if (tile.route) router.push(tile.route as any);
                }}
              >
                <View style={[styles.quickTileIcon, { backgroundColor: tile.bg }]}>
                  <Icon color={tile.color} size={18} />
                </View>
                <Text style={styles.quickTileTitle}>{tile.title}</Text>
                <Text style={[styles.quickTileSub, { color: tile.color }]}>{tile.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Featured Masterclass Courses ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Crown color={colors.neonAmber} size={18} />
              <Text style={styles.sectionTitle}>Full Masterclasses</Text>
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
                  activeOpacity={0.88}
                  onPress={() => router.push(`/(tabs)/courses/${item.slug}` as any)}
                >
                  <View style={styles.courseThumb}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} />
                    ) : (
                      <LinearGradient
                        colors={["rgba(176, 96, 240, 0.4)", "rgba(0, 243, 255, 0.2)"]}
                        style={styles.thumbGrad}
                      >
                        <BookOpen color={colors.neonPurple} size={36} />
                      </LinearGradient>
                    )}
                    <View style={styles.thumbBadge}>
                      <Badge label={item.category?.name || "Masterclass"} variant="purple" />
                    </View>
                  </View>

                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                    
                    <View style={styles.courseFooter}>
                      <View style={styles.lessonsCountBox}>
                        <BookOpen color={colors.mutedForeground} size={12} />
                        <Text style={styles.courseLessons}>{item.lessons?.length || 0} lessons</Text>
                      </View>
                      <View style={styles.pricePill}>
                        <Text style={styles.coursePrice}>
                          {item.price === 0 ? "FREE" : `₹${item.price.toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No masterclasses published yet.</Text>
              }
            />
          )}
        </View>

        {/* ── Hunter Pass Topic Modules ── */}
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
                  style={styles.moduleCard}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/(tabs)/courses/${item.slug}` as any)}
                >
                  <View style={styles.moduleThumb}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} />
                    ) : (
                      <LinearGradient
                        colors={["rgba(0, 243, 255, 0.3)", "rgba(34, 197, 94, 0.2)"]}
                        style={styles.thumbGrad}
                      >
                        <Swords color={colors.neonCyan} size={28} />
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.moduleInfo}>
                    <Badge label="Skill Module" variant="cyan" />
                    <Text style={styles.moduleTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.modulePrice}>
                      {item.price === 0 ? "FREE" : `₹${item.price.toLocaleString()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Combat Badges Strip ── */}
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsHeader}>HONOR BADGES</Text>
          <View style={styles.achievementsRow}>
            {[
              { title: "Shadow Monarch", icon: Crown, color: colors.neonAmber, border: "rgba(251, 191, 36, 0.3)", bg: "rgba(251, 191, 36, 0.08)" },
              { title: "Dungeon Raider", icon: Swords, color: colors.neonLime, border: "rgba(74, 222, 128, 0.3)", bg: "rgba(74, 222, 128, 0.08)" },
              { title: "Swift Blade", icon: Shield, color: colors.neonCyan, border: "rgba(56, 189, 248, 0.3)", bg: "rgba(56, 189, 248, 0.08)" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <View
                  key={idx}
                  style={[
                    styles.achievementCard,
                    { borderColor: item.border, backgroundColor: item.bg },
                  ]}
                >
                  <Icon color={item.color} size={18} />
                  <Text style={[styles.achievementTitle, { color: item.color }]}>
                    {item.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Notification Sheet ── */}
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
                <Bell color={colors.mutedForeground} size={44} opacity={0.3} />
                <Text style={styles.notifEmptyTitle}>All caught up!</Text>
                <Text style={styles.notifEmptySub}>
                  Course updates, certifications, and support responses will appear here.
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

      {/* ── AI Assistant Modal ── */}
      <CourseAssistantModal
        visible={assistantVisible}
        onClose={() => setAssistantVisible(false)}
        initialQuery={assistantQuery}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 110 },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
    marginRight: spacing[2],
  },
  avatarCrestWrapper: {
    position: "relative",
  },
  avatarCrestGrad: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.4)",
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  statusDotBeacon: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#050810",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  brandInfo: {
    justifyContent: "center",
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitleText: {
    fontFamily: fonts.display,
    fontSize: 13.5,
    color: colors.foreground,
    letterSpacing: 1.2,
    fontWeight: "bold",
  },
  brandTitleAccent: {
    fontFamily: fonts.display,
    fontSize: 13.5,
    color: colors.foreground,
    letterSpacing: 1.2,
    fontWeight: "bold",
  },
  hunterStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  hunterNameText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    fontWeight: "600",
    maxWidth: 120,
  },
  rankPillMini: {
    backgroundColor: "rgba(176, 96, 240, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(176, 96, 240, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radii.full,
  },
  rankPillText: {
    fontFamily: fonts.display,
    fontSize: 8,
    fontWeight: "bold",
    color: colors.neonPurple,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  actionBtnAi: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    backgroundColor: "rgba(0, 243, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  aiSparkDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.neonCyan,
  },
  actionBtnNotif: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: colors.neonAmber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  notifBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: colors.destructive,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  notifBadgeText: {
    fontFamily: fonts.display,
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
  },

  // Hero Wrapper
  heroWrapper: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  heroBanner: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.2)",
    padding: spacing[4],
    overflow: "hidden",
    position: "relative",
  },
  neonAccentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.neonCyan,
  },
  heroContent: {
    gap: spacing[2],
  },
  heroTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 243, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.3)",
  },
  heroStatusText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.8,
  },
  heroRankPill: {
    backgroundColor: "rgba(176, 96, 240, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(176, 96, 240, 0.4)",
  },
  heroRankText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonPurple,
  },
  heroHeadline: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
    lineHeight: 24,
    marginTop: 4,
  },
  heroSubheadline: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: 6,
  },
  heroPrimaryBtn: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  heroPrimaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing[3],
  },
  heroPrimaryBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: "#050810",
    letterSpacing: 0.5,
  },
  heroSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: "rgba(0, 243, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.3)",
  },
  heroSecondaryBtnText: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "bold",
    color: colors.neonCyan,
  },
  videoPlayerBox: {
    marginTop: spacing[3],
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.35)",
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: "100%",
    height: 180,
  },
  videoCaptionBar: {
    backgroundColor: "rgba(5, 8, 16, 0.95)",
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  videoCaptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  videoCaptionText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.foreground,
    fontWeight: "600",
  },
  adLiveBadge: {
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adLiveText: {
    fontFamily: fonts.display,
    fontSize: 8,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.8,
  },

  // Hunter Combat HUD
  hudWrapper: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  statsCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(176, 96, 240, 0.3)",
  },
  statsCardGrad: {
    padding: spacing[4],
    gap: spacing[3],
  },
  hudTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  hudRankBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: "rgba(176, 96, 240, 0.2)",
    borderWidth: 1.5,
    borderColor: colors.neonPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  hudRankLetter: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.neonPurple,
  },
  hudRankName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
  },
  hudPrestigeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(176, 96, 240, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hudPrestigeText: {
    fontFamily: fonts.display,
    fontSize: 8,
    fontWeight: "bold",
    color: colors.neonPurple,
  },
  hudExpSub: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  streakPillText: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "bold",
    color: colors.neonAmber,
  },
  gaugesContainer: {
    gap: spacing[2],
  },
  gaugesSplit: {
    flexDirection: "row",
    gap: spacing[2],
  },

  // Tactical Quick Actions Matrix
  quickMatrixWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  quickTile: {
    width: (SCREEN_W - spacing[4] * 2 - spacing[2]) / 2,
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 3,
  },
  quickTileIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickTileTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
  },
  quickTileSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: "600",
  },

  // Section Standard Headers
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    fontWeight: "bold",
    color: colors.foreground,
    letterSpacing: 0.5,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: colors.neonPurple,
    fontWeight: "bold",
  },
  horizontalList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },

  // Masterclass Course Cards
  courseCard: {
    width: CARD_W,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  courseCardSkeleton: {
    width: CARD_W,
    height: 220,
    borderRadius: radii.xl,
  },
  courseThumb: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surface2,
    position: "relative",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbBadge: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  courseInfo: {
    padding: spacing[3],
    gap: spacing[2],
  },
  courseTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
    lineHeight: 18,
    minHeight: 36,
  },
  courseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  lessonsCountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  courseLessons: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  pricePill: {
    backgroundColor: "rgba(0, 243, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.3)",
  },
  coursePrice: {
    fontFamily: fonts.display,
    fontSize: 11,
    fontWeight: "bold",
    color: colors.neonCyan,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginLeft: spacing[4],
  },

  // Module Grid
  moduleGrid: {
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  moduleCard: {
    width: (SCREEN_W - spacing[4] * 2 - spacing[3]) / 2,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.15)",
    overflow: "hidden",
  },
  moduleThumb: {
    width: "100%",
    height: 90,
    backgroundColor: colors.surface2,
  },
  moduleInfo: {
    padding: spacing[3],
    gap: 4,
  },
  moduleTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.foreground,
    minHeight: 28,
  },
  modulePrice: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "bold",
    color: colors.neonLime,
    marginTop: 2,
  },

  // Achievements Badges
  achievementsSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
  achievementsHeader: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "bold",
    color: colors.mutedForeground,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  achievementsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  achievementCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  achievementTitle: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
  },

  // Notification Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "75%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
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
    fontSize: fontSizes.md,
    fontWeight: "bold",
    color: colors.foreground,
  },
  modalBadge: {
    backgroundColor: colors.neonAmber,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  modalBadgeText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: "#050810",
  },
  markAllText: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 4,
  },
  notifEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[2],
  },
  notifEmptyTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
  },
  notifEmptySub: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  notifList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  notifItem: {
    padding: spacing[3],
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  notifItemUnread: {
    borderColor: "rgba(251, 191, 36, 0.4)",
    backgroundColor: "rgba(251, 191, 36, 0.05)",
  },
  notifItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifItemTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
  },
  notifItemDate: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
  },
  notifItemMessage: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
});
