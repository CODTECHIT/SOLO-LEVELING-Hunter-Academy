import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Lock,
  Download,
  Trash2,
  HardDriveDownload,
  WifiOff,
  Award,
} from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ScreenCapture from "expo-screen-capture";
import { useCourse, useEnrolledCourses } from "@/hooks/useCourses";
import { useOfflineDownloads } from "@/hooks/useOfflineDownloads";
import { useAuthStore } from "@/store/authStore";
import { CertificateModal } from "@/components/ui/CertificateModal";
import { api } from "@/lib/api";
import { getCloudFrontUrl, getYouTubeVideoId } from "@/lib/cdn";
import { WebView } from "react-native-webview";
import { useQueryClient } from "@tanstack/react-query";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function LearningPlayerScreen() {
  const { courseId, lessonId: initialLessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId?: string;
  }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Screen recording restriction (Active across the player screen)
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  const {
    isDownloaded,
    getOfflineUri,
    downloadLesson,
    deleteDownload,
    progressMap,
    isDownloading,
  } = useOfflineDownloads();

  const { data: enrollments } = useEnrolledCourses();
  const { user } = useAuthStore();
  const course = enrollments?.find((c: any) => c.id === courseId);
  const slug = course?.slug;

  const { data, isLoading } = useCourse(slug ?? "");

  const lessons = data?.course.lessons ?? [];
  const [activeId, setActiveId] = useState<string>(
    initialLessonId ?? lessons[0]?.id ?? "",
  );
  const [showLessons, setShowLessons] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeLesson: any = lessons.find((l: any) => l.id === activeId) ?? lessons[0];
  const isEnrolled = data?.isEnrolled ?? false;
  const completedIds = data?.completedLessonIds ?? [];
  const progress = lessons.length > 0
    ? Math.round((completedIds.length / lessons.length) * 100)
    : 0;

  const offlineUri = activeLesson ? getOfflineUri(activeLesson.id) : null;
  const youtubeId = getYouTubeVideoId(activeLesson?.videoUrl ?? "");
  const cloudFrontUrl = getCloudFrontUrl(activeLesson?.videoUrl ?? "");
  const videoSource = offlineUri || (youtubeId ? "" : cloudFrontUrl);

  // Video player (for native expo-video with offline sandbox playback support)
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.play();
  });

  // Report progress every 10 seconds while playing
  const reportProgress = useCallback(async (watchedSeconds: number, duration?: number) => {
    if (!activeLesson) return;
    try {
      await api.post("/users/progress", {
        lessonId: activeLesson.id,
        watchedSeconds,
        duration,
      });
      await qc.invalidateQueries({ queryKey: ["course", slug] });
      await qc.invalidateQueries({ queryKey: ["enrollments"] });
    } catch {
      // Silent fail — progress will be retried next tick
    }
  }, [activeLesson, slug, qc]);

  if (isLoading || !data) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft color={colors.foreground} size={20} />
        <Text style={styles.backText}>My Learning</Text>
      </TouchableOpacity>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {isEnrolled && activeLesson ? (
          youtubeId ? (
            <WebView
              style={styles.video}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <style>
                        body { margin: 0; background: black; display: flex; height: 100vh; align-items: center; justify-content: center; overflow: hidden; }
                        iframe { width: 100vw; height: 100vh; border: none; }
                      </style>
                    </head>
                    <body>
                      <iframe src="https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1&playsinline=1&modestbranding=1&origin=https://www.youtube.com" allowfullscreen allow="autoplay; fullscreen"></iframe>
                    </body>
                  </html>
                `,
                baseUrl: "https://www.youtube.com",
              }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
            />
          ) : (
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={true}
              contentFit="contain"
            />
          )
        ) : (
          <View style={styles.videoLocked}>
            <Lock color={colors.mutedForeground} size={40} />
            <Text style={styles.lockedText}>Enroll to watch</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <ProgressBar
          value={progress}
          color={progress >= 100 ? colors.neonLime : colors.neonPurple}
          label={`${completedIds.length}/${lessons.length} lessons`}
          showPercent
          height={6}
        />
      </View>

      {/* 100% Certificate Conquest Banner */}
      {progress >= 100 && (
        <View style={styles.certBanner}>
          <View style={styles.certBannerLeft}>
            <Award color={colors.neonLime} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={styles.certBannerTitle}>Course Conquered!</Text>
              <Text style={styles.certBannerSub}>Official Certificate Ready</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.claimCertBtn}
            onPress={() => setCertModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.claimCertBtnText}>View / Download</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lesson title & Offline Download Action */}
      <View style={styles.lessonHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle}>{activeLesson?.title}</Text>
          {offlineUri && (
            <View style={styles.offlineBadgeRow}>
              <WifiOff color={colors.neonLime} size={12} />
              <Text style={styles.offlineBadgeText}>Playing Offline Sandboxed</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {completedIds.includes(activeLesson?.id ?? "") && (
            <CheckCircle2 color={colors.neonLime} size={20} />
          )}

          {isEnrolled && activeLesson && (
            isDownloaded(activeLesson.id) ? (
              <TouchableOpacity
                style={styles.downloadBtnSuccess}
                onPress={() => {
                  Alert.alert(
                    "Delete Offline Download",
                    "Do you want to remove this video from your device storage?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteDownload(activeLesson.id),
                      },
                    ]
                  );
                }}
              >
                <Trash2 color={colors.destructive || "#ef4444"} size={16} />
              </TouchableOpacity>
            ) : isDownloading(activeLesson.id) ? (
              <View style={styles.downloadingContainer}>
                <ActivityIndicator size="small" color={colors.neonCyan} />
                <Text style={styles.downloadingText}>
                  {progressMap[activeLesson.id] ?? 0}%
                </Text>
              </View>
            ) : (
              !getYouTubeVideoId(activeLesson.videoUrl || "") && (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={async () => {
                    try {
                      await downloadLesson({
                        id: activeLesson.id,
                        title: activeLesson.title,
                        courseId: courseId,
                        courseTitle: data.course.title,
                        videoUrl: activeLesson.videoUrl,
                        duration: activeLesson.duration,
                      });
                      Alert.alert(
                        "Downloaded!",
                        "Lesson saved securely in-app for offline playback."
                      );
                    } catch (err: any) {
                      Alert.alert("Download Error", err.message || "Failed to download");
                    }
                  }}
                >
                  <Download color={colors.neonCyan} size={16} />
                  <Text style={styles.downloadBtnText}>Save Offline</Text>
                </TouchableOpacity>
              )
            )
          )}
        </View>
      </View>

      {/* Toggle lesson list */}
      <TouchableOpacity
        style={styles.lessonToggle}
        onPress={() => setShowLessons((v) => !v)}
      >
        <Text style={styles.lessonToggleText}>Course Content ({lessons.length} lessons)</Text>
        <ChevronDown
          color={colors.neonPurple}
          size={16}
          style={{ transform: [{ rotate: showLessons ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>

      {/* Lesson list */}
      {showLessons && (
        <ScrollView style={styles.lessonList} showsVerticalScrollIndicator={false}>
          {lessons.map((lesson: any, idx: number) => {
            const isCompleted = completedIds.includes(lesson.id);
            const isActive = lesson.id === activeId;
            const isAccessible = isEnrolled;
            const isLessonSaved = isDownloaded(lesson.id);
            const isLessonDownloading = isDownloading(lesson.id);

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonRow, isActive && styles.lessonRowActive]}
                activeOpacity={isAccessible ? 0.75 : 1}
                onPress={() => {
                  if (isAccessible) {
                    setActiveId(lesson.id);
                    setShowLessons(false);
                  }
                }}
              >
                <View style={styles.lessonNum}>
                  {isCompleted ? (
                    <CheckCircle2 color={colors.neonLime} size={16} />
                  ) : (
                    <Text style={[styles.numText, isActive && { color: colors.neonPurple }]}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.lessonName,
                    isActive && styles.lessonNameActive,
                    !isAccessible && styles.lessonLocked,
                  ]}
                  numberOfLines={2}
                >
                  {lesson.title}
                </Text>

                {isAccessible && (
                  isLessonSaved ? (
                    <View style={styles.savedIconBadge}>
                      <HardDriveDownload color={colors.neonLime} size={14} />
                    </View>
                  ) : isLessonDownloading ? (
                    <Text style={styles.downloadingSmallText}>
                      {progressMap[lesson.id]}%
                    </Text>
                  ) : null
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        visible={certModalVisible}
        onClose={() => setCertModalVisible(false)}
        userName={user?.name ?? "Hunter"}
        courseTitle={data?.course?.title ?? course?.title ?? "Master Course"}
        courseId={courseId}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: fonts.body, color: colors.mutedForeground, fontSize: fontSizes.base },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  backText: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.foreground },
  videoContainer: {
    width: SCREEN_W,
    height: (SCREEN_W * 9) / 16,
    backgroundColor: "#000",
  },
  video: { width: "100%", height: "100%" },
  videoLocked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    gap: spacing[3],
  },
  lockedText: { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.mutedForeground },
  progressRow: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },

  // Certificate banner
  certBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing[4],
    marginTop: spacing[1],
    marginBottom: spacing[4],
    padding: 14,
    borderRadius: radii.xl,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1.5,
    borderColor: colors.neonLime,
    shadowColor: colors.neonLime,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    gap: spacing[3],
  },
  certBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  certBannerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.neonLime,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  certBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  claimCertBtn: {
    backgroundColor: colors.neonLime,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
  },
  claimCertBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: "#050810",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[1],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  lessonTitle: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  lessonToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  lessonToggleText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.foreground,
    letterSpacing: 1,
  },
  lessonList: { flex: 1 },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonRowActive: {
    backgroundColor: colors.neonPurpleAlpha20,
    borderLeftWidth: 3,
    borderLeftColor: colors.neonPurple,
  },
  lessonNum: { width: 24, alignItems: "center" },
  numText: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.mutedForeground },
  lessonName: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.foreground },
  lessonNameActive: { color: colors.neonPurple, fontFamily: fonts.bodySemiBold },
  lessonLocked: { color: colors.mutedForeground },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  offlineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  offlineBadgeText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.neonLime,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.neonCyanAlpha20,
    borderColor: colors.neonCyan,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  downloadBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  downloadBtnSuccess: {
    padding: 6,
    borderRadius: radii.md,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  downloadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  downloadingText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  downloadingSmallText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  savedIconBadge: {
    padding: 2,
  },
});
