import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, ChevronDown, Lock } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCourse, useEnrolledCourses } from "@/hooks/useCourses";
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

  const { data: enrollments } = useEnrolledCourses();
  const course = enrollments?.find((c: any) => c.id === courseId);
  const slug = course?.slug;

  const { data, isLoading } = useCourse(slug ?? "");

  const lessons = data?.course.lessons ?? [];
  const [activeId, setActiveId] = useState<string>(
    initialLessonId ?? lessons[0]?.id ?? "",
  );
  const [showLessons, setShowLessons] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeLesson = lessons.find((l: any) => l.id === activeId) ?? lessons[0];
  const isEnrolled = data?.isEnrolled ?? false;
  const completedIds = data?.completedLessonIds ?? [];
  const progress = lessons.length > 0
    ? Math.round((completedIds.length / lessons.length) * 100)
    : 0;

  const youtubeId = getYouTubeVideoId(activeLesson?.videoUrl ?? "");
  const cloudFrontUrl = getCloudFrontUrl(activeLesson?.videoUrl ?? "");

  // Video player (for native expo-video)
  const player = useVideoPlayer(youtubeId ? "" : cloudFrontUrl, (p) => {
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
              allowsFullscreen
              allowsPictureInPicture
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

      {/* Lesson title */}
      <View style={styles.lessonHeader}>
        <Text style={styles.lessonTitle}>{activeLesson?.title}</Text>
        {completedIds.includes(activeLesson?.id ?? "") && (
          <CheckCircle2 color={colors.neonLime} size={20} />
        )}
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
                  style={[styles.lessonName, isActive && styles.lessonNameActive, !isAccessible && styles.lessonLocked]}
                  numberOfLines={2}
                >
                  {lesson.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
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
});
