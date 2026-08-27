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
  RefreshControl,
  StatusBar,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Lock,
  Award,
  ChevronRight,
  Sparkles,
  Swords,
  Zap,
  Bot,
} from "lucide-react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafePreventScreenCapture, useScreenshotListener } from "@/hooks/useSafeScreenCapture";
import { useCourse, useEnrolledCourses } from "@/hooks/useCourses";
import { useAuthStore } from "@/store/authStore";
import { CertificateModal } from "@/components/ui/CertificateModal";
import { CourseAssistantModal } from "@/components/ui/CourseAssistantModal";
import { api } from "@/lib/api";
import { getCloudFrontUrl, getYouTubeVideoId } from "@/lib/cdn";
import { WebView } from "react-native-webview";
import { useQueryClient } from "@tanstack/react-query";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function LearningPlayerScreen() {
  const { courseId, lessonId: initialLessonId } = useLocalSearchParams<{
    courseId: string;
    lessonId?: string;
  }>();
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  // Screen recording restriction (Active across the player screen)
  useSafePreventScreenCapture("learning_player_screen");

  const { data: enrollments, refetch: refetchEnrollments } = useEnrolledCourses();
  const { user } = useAuthStore();
  const course = enrollments?.find((c: any) => c.id === courseId || c.slug === courseId);
  const slug = course?.slug || courseId;

  const { data, isLoading, refetch: refetchCourse } = useCourse(slug ?? "");

  const lessons = data?.course?.lessons ?? [];
  const [activeId, setActiveId] = useState<string>(
    initialLessonId ?? lessons[0]?.id ?? "",
  );
  const [showLessons, setShowLessons] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [assistantModalVisible, setAssistantModalVisible] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isMarkingComplete, setIsMarkingComplete] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isScreenRecordingBlocked, setIsScreenRecordingBlocked] = useState<boolean>(false);

  // Fullscreen orientation handlers (instant switch to landscape / portrait)
  const enterFullscreen = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
      StatusBar.setHidden(true, "fade");
    }
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch {}
      StatusBar.setHidden(false, "fade");
    }
    setIsFullscreen(false);
  }, []);

  // Cleanup orientation on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
        StatusBar.setHidden(false, "fade");
      }
    };
  }, []);

  // Strict anti-download prevention on HTML5 video elements (web preview)
  useEffect(() => {
    if (Platform.OS === "web") {
      const applyNoDownload = () => {
        const videoElements = document.querySelectorAll("video");
        videoElements.forEach((video) => {
          video.setAttribute("controlsList", "nodownload");
          video.setAttribute("disablePictureInPicture", "true");
        });
      };
      applyNoDownload();
      const interval = setInterval(applyNoDownload, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Auto-pause video, blackout player and alert if screenshot or screen capture is triggered
  useScreenshotListener(() => {
    try {
      player?.pause();
    } catch {}
    setIsScreenRecordingBlocked(true);
    Alert.alert(
      "Screen Capture Restricted",
      "Screen recording or capturing academy lectures is strictly prohibited. Playback has been secured.",
      [
        {
          text: "Resume",
          onPress: () => setIsScreenRecordingBlocked(false),
        },
      ]
    );
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCourse(), refetchEnrollments()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!activeId && lessons.length > 0) {
      setActiveId(initialLessonId ?? lessons[0].id);
    }
  }, [lessons, initialLessonId, activeId]);

  const activeLesson: any = lessons.find((l: any) => l.id === activeId) ?? lessons[0];
  const isEnrolled = data?.isEnrolled ?? false;
  const completedIds = data?.completedLessonIds ?? [];
  const isCurrentCompleted = completedIds.includes(activeLesson?.id ?? "");
  const progress = lessons.length > 0
    ? Math.round((completedIds.length / lessons.length) * 100)
    : 0;

  const youtubeId = getYouTubeVideoId(activeLesson?.videoUrl ?? "");
  const cloudFrontUrl = getCloudFrontUrl(activeLesson?.videoUrl ?? "");
  const videoSource = youtubeId ? "" : cloudFrontUrl;

  // Video player (for native expo-video)
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.play();
  });

  // Report progress periodically to backend
  const reportProgress = useCallback(
    async (watchedSeconds: number, duration?: number, markComplete = false) => {
      if (!activeLesson) return;
      try {
        await api.post("/users/progress", {
          lessonId: activeLesson.id,
          watchedSeconds,
          duration,
          completed: markComplete || undefined,
        });
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["course", slug] }),
          qc.invalidateQueries({ queryKey: ["course", courseId] }),
          qc.invalidateQueries({ queryKey: ["enrollments"] }),
          qc.invalidateQueries({ queryKey: ["hunter-stats"] }),
        ]);
      } catch {
        // Silent fail — progress will be retried
      }
    },
    [activeLesson, slug, courseId, qc],
  );

  // Auto playback progress tracking & playToEnd listener
  useEffect(() => {
    if (!player || !isEnrolled || !activeLesson) return;

    const interval = setInterval(() => {
      try {
        if (player.currentTime !== undefined && player.currentTime >= 0) {
          const cur = Math.floor(player.currentTime);
          const dur = Math.floor(player.duration || activeLesson.duration || 0);
          setVideoCurrentTime(cur);
          if (dur > 0) setVideoDuration(dur);

          if (player.playing && cur > 0) {
            const isAutoCompleted = dur > 0 && cur >= Math.floor(dur * 0.9);
            reportProgress(cur, dur, isAutoCompleted);
          }
        }
      } catch {
        // player state transitioning
      }
    }, 4000);

    const sub = player.addListener?.("playToEnd", () => {
      handleMarkLessonComplete(true);
    });

    return () => {
      clearInterval(interval);
      sub?.remove?.();
    };
  }, [player, isEnrolled, activeLesson, reportProgress]);

  // Mark lesson as complete handler
  const handleMarkLessonComplete = async (autoAdvance = false) => {
    if (!activeLesson || isMarkingComplete) return;
    try {
      setIsMarkingComplete(true);
      const dur = activeLesson.duration || videoDuration || 60;
      await api.post("/users/progress", {
        lessonId: activeLesson.id,
        watchedSeconds: dur,
        duration: dur,
        completed: true,
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["course", slug] }),
        qc.invalidateQueries({ queryKey: ["course", courseId] }),
        qc.invalidateQueries({ queryKey: ["enrollments"] }),
        qc.invalidateQueries({ queryKey: ["hunter-stats"] }),
      ]);

      const wasAlreadyCompleted = completedIds.includes(activeLesson.id);
      const newCompletedCount = wasAlreadyCompleted ? completedIds.length : completedIds.length + 1;

      // If course is fully complete, trigger certificate modal!
      if (newCompletedCount >= lessons.length && lessons.length > 0) {
        setTimeout(() => {
          setCertModalVisible(true);
        }, 300);
      } else if (autoAdvance) {
        const curIndex = lessons.findIndex((l: any) => l.id === activeLesson.id);
        if (curIndex !== -1 && curIndex + 1 < lessons.length) {
          setActiveId(lessons[curIndex + 1].id);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update progress");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const currentIndex = lessons.findIndex((l: any) => l.id === activeLesson?.id);
  const nextLesson = currentIndex !== -1 && currentIndex + 1 < lessons.length ? lessons[currentIndex + 1] : null;

  if (isLoading || !data) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.neonCyan} />
          <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading lesson & dungeon tracks...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft color={colors.foreground} size={20} />
        <Text style={styles.backText}>My Learning</Text>
      </TouchableOpacity>

      {/* Portrait Video Player */}
      <View style={styles.videoContainer}>
        {isEnrolled && activeLesson ? (
          <>
            {youtubeId ? (
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
                        <iframe src="https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1&playsinline=1&modestbranding=1&fs=0&origin=https://www.youtube.com" allow="autoplay"></iframe>
                      </body>
                    </html>
                  `,
                  baseUrl: "https://www.youtube.com",
                }}
                allowsFullscreenVideo={true}
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
                surfaceType="textureView"
                allowsPictureInPicture={false}
                startsPictureInPictureAutomatically={false}
                fullscreenOptions={{
                  enable: true,
                  orientation: "landscape",
                }}
                onFullscreenEnter={async () => {
                  if (Platform.OS !== "web") {
                    try {
                      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                    } catch {}
                    StatusBar.setHidden(true, "fade");
                  }
                }}
                onFullscreenExit={async () => {
                  if (Platform.OS !== "web") {
                    try {
                      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    } catch {}
                    StatusBar.setHidden(false, "fade");
                  }
                }}
              />
            )}

            {/* Dynamic Security DRM Watermark (User Anti-Piracy Stamp) */}
            {user && !isScreenRecordingBlocked && (
              <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={styles.watermarkText}>
                  HUNTER SECURE • {user.email || user.name || "STUDENT"} • {user.id ? user.id.slice(-6).toUpperCase() : "PROT"}
                </Text>
              </View>
            )}

            {/* Active Capture Blackout Layer */}
            {isScreenRecordingBlocked && (
              <View style={styles.blackoutOverlay}>
                <Text style={styles.blackoutText}>Screen Capture Restricted</Text>
                <Text style={styles.blackoutSub}>Video feed protected by Academy DRM</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.videoLocked}>
            <Lock color={colors.mutedForeground} size={40} />
            <Text style={styles.lockedText}>Enroll to watch</Text>
          </View>
        )}
      </View>

      {/* Fullscreen Landscape Modal */}
      <Modal
        visible={isFullscreen}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
        onRequestClose={exitFullscreen}
      >
        <View style={styles.modalFullscreenContainer}>
          {youtubeId ? (
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
                      <iframe src="https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1&playsinline=1&modestbranding=1&fs=0&origin=https://www.youtube.com" allow="autoplay"></iframe>
                    </body>
                  </html>
                `,
                baseUrl: "https://www.youtube.com",
              }}
              allowsFullscreenVideo={true}
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
              surfaceType="textureView"
              allowsPictureInPicture={false}
              startsPictureInPictureAutomatically={false}
            />
          )}

          {/* Dynamic Security DRM Watermark in Fullscreen */}
          {user && !isScreenRecordingBlocked && (
            <View style={styles.watermarkContainerFullscreen} pointerEvents="none">
              <Text style={styles.watermarkText}>
                HUNTER SECURE • {user.email || user.name || "STUDENT"} • {user.id ? user.id.slice(-6).toUpperCase() : "PROT"}
              </Text>
            </View>
          )}

          {/* Active Capture Blackout in Fullscreen */}
          {isScreenRecordingBlocked && (
            <View style={styles.blackoutOverlay}>
              <Text style={styles.blackoutText}>Screen Capture Restricted</Text>
              <Text style={styles.blackoutSub}>Video feed protected by Academy DRM</Text>
            </View>
          )}
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
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
        {/* Action Strip: Mark Lesson Complete / Ask AI / Next Lesson */}
        {isEnrolled && activeLesson && (
          <View style={styles.actionStrip}>
          <TouchableOpacity
            style={[
              styles.completeActionBtn,
              isCurrentCompleted ? styles.completeActionBtnDone : styles.completeActionBtnActive,
            ]}
            onPress={() => handleMarkLessonComplete(false)}
            disabled={isMarkingComplete}
            activeOpacity={0.85}
          >
            {isMarkingComplete ? (
              <ActivityIndicator size="small" color={isCurrentCompleted ? colors.neonLime : "#050810"} />
            ) : isCurrentCompleted ? (
              <>
                <CheckCircle2 color={colors.neonLime} size={16} />
                <Text style={styles.completeActionTextDone}>Completed</Text>
              </>
            ) : (
              <>
                <CheckCircle2 color="#050810" size={16} />
                <Text style={styles.completeActionTextActive}>Mark Complete</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assistantActionBtn}
            onPress={() => setAssistantModalVisible(true)}
            activeOpacity={0.85}
          >
            <Bot color={colors.neonCyan} size={16} />
            <Text style={styles.assistantActionBtnText}>Ask AI</Text>
          </TouchableOpacity>

          {nextLesson && (
            <TouchableOpacity
              style={styles.nextLessonBtn}
              onPress={() => setActiveId(nextLesson.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.nextLessonText}>Next</Text>
              <ChevronRight color={colors.neonCyan} size={16} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Course Overall Progress bar */}
      <View style={styles.progressRow}>
        <ProgressBar
          value={progress}
          color={progress >= 100 ? colors.neonLime : colors.neonCyan}
          label={`${completedIds.length}/${lessons.length} lessons conquered`}
          showPercent
          height={7}
        />
      </View>

      {/* 100% Certificate Conquest Banner */}
      {progress >= 100 && (
        <View style={styles.certBanner}>
          <View style={styles.certBannerLeft}>
            <Award color={colors.neonLime} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={styles.certBannerTitle}>Dungeon Cleared!</Text>
              <Text style={styles.certBannerSub}>Official Academy Certificate Unlocked</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.claimCertBtn}
            onPress={() => setCertModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.claimCertBtnText}>View Certificate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lesson title */}
      <View style={styles.lessonHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lessonTitle}>{activeLesson?.title}</Text>
        </View>

        <View style={styles.headerActions}>
          {isCurrentCompleted && (
            <CheckCircle2 color={colors.neonLime} size={20} />
          )}
        </View>
      </View>

      {/* AI Lesson Knowledge Assistant Banner */}
      {isEnrolled && (
        <TouchableOpacity
          style={styles.assistantBanner}
          activeOpacity={0.85}
          onPress={() => setAssistantModalVisible(true)}
        >
          <View style={styles.assistantIconBox}>
            <Bot color={colors.neonCyan} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.assistantBannerTitle}>AI Lesson Assistant</Text>
            <Text style={styles.assistantBannerSub}>Instant FAQ answers & 1-tap support escalation</Text>
          </View>
          <View style={styles.assistantOpenBadge}>
            <Text style={styles.assistantOpenBadgeText}>Ask</Text>
            <ChevronRight color={colors.neonCyan} size={14} />
          </View>
        </TouchableOpacity>
      )}

      {/* Lesson Quiz Banner (if active lesson has a quiz) */}
      {activeLesson?.quiz && (
        <TouchableOpacity
          style={styles.quizBanner}
          activeOpacity={0.85}
          onPress={() => router.push(`/quiz/${activeLesson.quiz.id}` as any)}
        >
          <View style={styles.quizIconBox}>
            <Sparkles color={colors.neonPurple} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.quizTagRow}>
              <Text style={styles.quizBadgeText}>LESSON ASSESSMENT</Text>
              {activeLesson.quiz.timeLimit > 0 && (
                <Text style={styles.quizTimeText}>⏱ {activeLesson.quiz.timeLimit} mins</Text>
              )}
            </View>
            <Text style={styles.quizTitleText} numberOfLines={1}>
              {activeLesson.quiz.title}
            </Text>
          </View>
          <View style={styles.takeQuizBtn}>
            <Text style={styles.takeQuizBtnText}>Take Quiz</Text>
            <ChevronRight color="#ffffff" size={14} />
          </View>
        </TouchableOpacity>
      )}

      {/* Standalone Course Quizzes List (if any) */}
      {(data?.course?.quizzes?.length ?? 0) > 0 && (
        <View style={styles.courseQuizzesBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Swords color={colors.neonPurple} size={16} />
            <Text style={[styles.courseQuizzesTitle, { marginBottom: 0 }]}>Course Assessments</Text>
          </View>
          {data.course.quizzes?.map((q: any) => (
            <TouchableOpacity
              key={q.id}
              style={styles.standaloneQuizItem}
              activeOpacity={0.85}
              onPress={() => router.push(`/quiz/${q.id}` as any)}
            >
              <View style={styles.standaloneQuizLeft}>
                <Sparkles color={colors.neonCyan} size={16} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.standaloneQuizName} numberOfLines={1}>{q.title}</Text>
                  <Text style={styles.standaloneQuizMeta}>
                    {q._count?.questions ?? 0} Questions • Pass {q.passingScore}%
                  </Text>
                </View>
              </View>
              <View style={styles.takeQuizBtnSmall}>
                <Text style={styles.takeQuizBtnSmallText}>Start</Text>
                <ChevronRight color="#050810" size={12} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
            const hasQuiz = Boolean(lesson.quiz);

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
                <View style={{ flex: 1, gap: 2 }}>
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
                  {hasQuiz && (
                    <View style={styles.quizPill}>
                      <Zap color={colors.neonCyan} size={10} style={{ marginRight: 3 }} />
                      <Text style={styles.quizPillText}>Quiz Attached</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      </ScrollView>

      {/* Course Knowledge Assistant Modal */}
      <CourseAssistantModal
        visible={assistantModalVisible}
        onClose={() => setAssistantModalVisible(false)}
        courseId={courseId}
        courseTitle={data?.course?.title ?? course?.title}
        lessonId={activeLesson?.id}
        lessonTitle={activeLesson?.title}
      />

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
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
  },
  videoContainerFullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 9999,
    justifyContent: "center",
  },
  modalFullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    width: "100%",
    height: "100%",
    justifyContent: "center",
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
  
  // Interactive Action Strip
  actionStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  completeActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  completeActionBtnActive: {
    backgroundColor: colors.neonCyan,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  completeActionBtnDone: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  completeActionTextActive: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: "#050810",
    letterSpacing: 0.5,
  },
  completeActionTextDone: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonLime,
    letterSpacing: 0.5,
  },
  nextLessonBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(103, 232, 249, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.3)",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    gap: 4,
  },
  nextLessonText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  assistantActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(176, 96, 240, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(176, 96, 240, 0.4)",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    gap: 5,
  },
  assistantActionBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  assistantBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(176, 96, 240, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.3)",
    borderRadius: radii.lg,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  assistantIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: "rgba(103, 232, 249, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.3)",
  },
  assistantBannerTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.5,
  },
  assistantBannerSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  assistantOpenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(103, 232, 249, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    gap: 2,
  },
  assistantOpenBadgeText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonCyan,
  }, progressRow: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },

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

  // Quiz Banner & Badges
  quizBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[3],
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.4)",
    gap: spacing[3],
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  quizIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: "rgba(168, 85, 247, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  quizTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  quizBadgeText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonPurple,
    letterSpacing: 0.8,
  },
  quizTimeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
  },
  quizTitleText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
  },
  takeQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  takeQuizBtnText: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // Course Quizzes Box
  courseQuizzesBox: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  courseQuizzesTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonCyan,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  standaloneQuizItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.15)",
  },
  standaloneQuizLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  standaloneQuizName: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.foreground,
  },
  standaloneQuizMeta: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  takeQuizBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.neonCyan,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  takeQuizBtnSmallText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: "#050810",
  },
  quizPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    marginTop: 2,
  },
  quizPillText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonPurple,
  },
  blackoutOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
  },
  blackoutText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    fontWeight: "bold",
    color: colors.neonCyan,
    textAlign: "center",
  },
  blackoutSub: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: "center",
  },
  watermarkContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  watermarkContainerFullscreen: {
    position: "absolute",
    top: 24,
    right: 32,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  watermarkText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.8,
  },
});
