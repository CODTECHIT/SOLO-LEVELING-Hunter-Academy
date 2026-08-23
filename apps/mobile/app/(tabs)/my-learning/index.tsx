import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { GraduationCap, BookOpen, HardDriveDownload, Trash2, Play, Award } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { CertificateModal } from "@/components/ui/CertificateModal";
import { useEnrolledCourses } from "@/hooks/useCourses";
import { useOfflineDownloads } from "@/hooks/useOfflineDownloads";
import { useAuthStore } from "@/store/authStore";
import { cyberAlert } from "@/store/alertStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function MyLearningScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertCourse, setSelectedCertCourse] = useState<{ id: string; title: string } | null>(null);
  const { data: courses, isLoading, refetch } = useEnrolledCourses();
  const { downloadedList, deleteDownload } = useOfflineDownloads();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Learning</Text>
        <Text style={styles.subtitle}>
          {tab === "ONLINE"
            ? `${courses?.length ?? 0} course${courses?.length !== 1 ? "s" : ""} enrolled`
            : `${downloadedList.length} lesson${downloadedList.length !== 1 ? "s" : ""} offline ready`}
        </Text>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "ONLINE" && styles.tabBtnActive]}
            onPress={() => setTab("ONLINE")}
          >
            <Text style={[styles.tabBtnText, tab === "ONLINE" && styles.tabBtnTextActive]}>
              Enrolled ({courses?.length ?? 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "OFFLINE" && styles.tabBtnActive]}
            onPress={() => setTab("OFFLINE")}
          >
            <Text style={[styles.tabBtnText, tab === "OFFLINE" && styles.tabBtnTextActive]}>
              Offline Downloads ({downloadedList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "ONLINE" ? (
        isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            renderItem={() => <SkeletonCard style={styles.card} />}
            keyExtractor={(i) => String(i)}
            contentContainerStyle={styles.list}
          />
        ) : (
          <FlatList
            data={courses ?? []}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/(tabs)/my-learning/${item.id}` as any)}
              >
                <View style={styles.cardInner}>
                  <View style={styles.cardThumb}>
                    {(item as any).thumbnail ? (
                      <Image
                        source={{ uri: (item as any).thumbnail }}
                        style={styles.thumbImg}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.neonPurple + "40", colors.neonCyan + "20"]}
                        style={styles.thumbGrad}
                      >
                        <BookOpen color={colors.neonPurple} size={28} />
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.topRow}>
                      <Badge label={(item as any).category?.name ?? "Course"} variant="purple" />
                      {(item as any).expired && <Badge label="Expired" variant="pink" />}
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  </View>
                </View>

                {/* Progress Bar & Certificate Action */}
                <View style={styles.cardFooter}>
                  <ProgressBar
                    value={item.progress}
                    color={item.progress >= 100 ? colors.neonLime : colors.neonCyan}
                    label={`${item.completedLessons}/${item.totalLessons} lessons`}
                    showPercent
                    height={6}
                  />

                  {item.progress >= 100 && (
                    <TouchableOpacity
                      style={styles.cardCertBtn}
                      activeOpacity={0.85}
                      onPress={() => setSelectedCertCourse({ id: item.id, title: item.title })}
                    >
                      <Award color={colors.neonLime} size={16} />
                      <Text style={styles.cardCertBtnText}>View / Download Certificate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.neonCyan}
                colors={[colors.neonCyan, colors.neonPurple]}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <GraduationCap color={colors.mutedForeground} size={56} />
                <Text style={styles.emptyTitle}>No courses yet</Text>
                <Text style={styles.emptySubtitle}>
                  Browse the catalog and enroll in your first course.
                </Text>
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={downloadedList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: "row" }}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    `/(tabs)/my-learning/${item.courseId}?lessonId=${item.id}` as any
                  )
                }
              >
                <View style={styles.cardThumb}>
                  <LinearGradient
                    colors={[colors.neonCyan + "40", colors.neonPurple + "30"]}
                    style={styles.thumbGrad}
                  >
                    <Play color={colors.neonCyan} size={24} />
                  </LinearGradient>
                </View>
                <View style={styles.cardBody}>
                  <Badge label="Sandboxed Offline" variant="cyan" />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.courseSubtitle} numberOfLines={1}>
                    {item.courseTitle}
                  </Text>
                  <Text style={styles.downloadDate}>
                    Saved {new Date(item.downloadedAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  cyberAlert(
                    "Delete Offline Download",
                    `Delete "${item.title}" from local device storage?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteDownload(item.id),
                      },
                    ],
                    "warning"
                  );
                }}
              >
                <Trash2 color={colors.destructive || "#ef4444"} size={18} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <HardDriveDownload color={colors.mutedForeground} size={56} />
              <Text style={styles.emptyTitle}>No Offline Videos</Text>
              <Text style={styles.emptySubtitle}>
                Save lessons while connected to watch them anywhere without internet.
              </Text>
            </View>
          }
        />
      )}

      {/* Certificate Modal */}
      <CertificateModal
        visible={!!selectedCertCourse}
        onClose={() => setSelectedCertCourse(null)}
        userName={user?.name ?? "Hunter"}
        courseTitle={selectedCertCourse?.title ?? "Course"}
        courseId={selectedCertCourse?.id ?? ""}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  list: { padding: spacing[4], gap: spacing[4], paddingBottom: 110 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.3)",
    overflow: "hidden",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardInner: {
    flexDirection: "row",
    padding: spacing[3],
    gap: spacing[3],
    alignItems: "center",
  },
  cardThumb: {
    width: 100,
    height: 76,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.2)",
  },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 4 },
  topRow: { flexDirection: "row", gap: spacing[2], marginBottom: 2 },
  cardTitle: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.foreground, lineHeight: 18, fontWeight: "600" },
  cardFooter: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    paddingTop: 2,
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  courseSubtitle: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  downloadDate: { fontFamily: fonts.body, fontSize: 10, color: colors.neonCyan },

  // Card certificate button
  cardCertBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: colors.neonLime,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  cardCertBtnText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonLime,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },

  tabRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: colors.neonPurpleAlpha20,
    borderColor: colors.neonPurple,
  },
  tabBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    fontWeight: "bold",
  },
  tabBtnTextActive: {
    color: colors.neonCyan,
  },
  deleteBtn: {
    paddingHorizontal: spacing[3],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: spacing[4], paddingHorizontal: spacing[6] },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.foreground, letterSpacing: 2 },
  emptySubtitle: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
