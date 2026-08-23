import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  ShoppingCart,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCourse } from "@/hooks/useCourses";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  RazorpayCheckoutModal,
  MobileRazorpayOrderData,
  MobileRazorpaySuccessPayload,
} from "@/components/payments/RazorpayCheckoutModal";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, refetch } = useCourse(slug);
  const [enrolling, setEnrolling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<MobileRazorpayOrderData | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (!data?.course?.id) return;
    setEnrolling(true);
    try {
      const res = await api.post("/payments/create-order", {
        courseId: data.course.id,
      });

      if (res.data.alreadyEnrolled) {
        Alert.alert("Notice", res.data.message || "You are already enrolled in this course.");
        await qc.invalidateQueries({ queryKey: ["course", slug] });
        return;
      }

      if (res.data.isFree) {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["course", slug] }),
          qc.invalidateQueries({ queryKey: ["enrollments"] }),
          qc.invalidateQueries({ queryKey: ["user-stats"] }),
        ]);
        Alert.alert("Enrolled! 🎉", "You now have access to this free course. Start learning!");
        return;
      }

      // Paid course -> Open Razorpay Modal
      setRazorpayOrder(res.data);
      setCheckoutVisible(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to initiate checkout";
      Alert.alert("Notice", typeof msg === "string" ? msg : "Checkout initialization failed");
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaymentSuccess = async (payload: MobileRazorpaySuccessPayload) => {
    try {
      setCheckoutVisible(false);
      setEnrolling(true);
      await api.post("/payments/verify", {
        razorpayOrderId: payload.razorpay_order_id,
        razorpayPaymentId: payload.razorpay_payment_id,
        razorpaySignature: payload.razorpay_signature,
        courseId: data?.course?.id,
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["course", slug] }),
        qc.invalidateQueries({ queryKey: ["enrollments"] }),
        qc.invalidateQueries({ queryKey: ["user-stats"] }),
      ]);

      Alert.alert(
        "Payment Confirmed! 🎉",
        "Your payment was successful and full access to this course is now unlocked.",
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Payment verification failed";
      Alert.alert("Verification Error", typeof msg === "string" ? msg : "Failed to verify payment");
    } finally {
      setEnrolling(false);
      setRazorpayOrder(null);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.neonPurple} size="large" />
        </View>
      </SafeScreen>
    );
  }

  if (!data) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Course not found</Text>
        </View>
      </SafeScreen>
    );
  }

  const { course, isEnrolled, completedLessonIds } = data;
  const progress = course.lessons.length > 0
    ? Math.round((completedLessonIds.length / course.lessons.length) * 100)
    : 0;

  const formatDuration = (secs: number | null) => {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    return m > 0 ? `${m}m` : `${secs}s`;
  };

  return (
    <SafeScreen>
      <ScrollView
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
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={20} />
        </TouchableOpacity>

        {/* Thumbnail */}
        <View style={styles.thumbContainer}>
          {course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
          ) : (
            <LinearGradient
              colors={[colors.neonPurple + "50", colors.neonCyan + "30"]}
              style={styles.thumbnail}
            >
              <BookOpen color={colors.neonPurple} size={56} />
            </LinearGradient>
          )}
          <View style={styles.thumbOverlay} />
        </View>

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badges}>
            <Badge label={course.category.name} variant="purple" />
            <Badge label={course.type} variant={course.type === "FULL" ? "amber" : "cyan"} />
            {isEnrolled && <Badge label="Enrolled" variant="lime" />}
          </View>

          {/* Title */}
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>{course.description}</Text>

          {/* Meta */}
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <BookOpen color={colors.neonCyan} size={14} />
              <Text style={styles.metaText}>{course.lessons.length} lessons</Text>
            </View>
          </View>

          {/* Progress (if enrolled) */}
          {isEnrolled && (
            <View style={styles.progressSection}>
              <ProgressBar
                value={progress}
                color={colors.neonLime}
                label={`Progress: ${completedLessonIds.length}/${course.lessons.length} lessons`}
                showPercent
                height={8}
              />
            </View>
          )}

          {/* Enroll / Price */}
          {!isEnrolled ? (
            <View style={styles.enrollSection}>
              <Text style={styles.priceTag}>
                {course.price === 0 ? "Free" : `₹${course.price.toLocaleString()}`}
              </Text>
              <Button
                label={enrolling ? "Enrolling..." : "Enroll Now"}
                onPress={handleEnroll}
                loading={enrolling}
                fullWidth
              />
            </View>
          ) : (
            <Button
              label="Continue Learning"
              onPress={() =>
                router.push(`/(tabs)/my-learning/${course.id}` as any)
              }
              fullWidth
              variant="ghost"
            />
          )}

          {/* Lesson List */}
          <View style={styles.lessonsSection}>
            <Text style={styles.lessonsTitle}>Course Content ({course.lessons.length} lessons)</Text>
            {course.lessons.map((lesson: any, idx: number) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isAccessible = isEnrolled;
              const hasQuiz = Boolean(lesson.quiz);
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonRow}
                  activeOpacity={isAccessible ? 0.75 : 1}
                  onPress={() => {
                    if (isAccessible) {
                      router.push(`/(tabs)/my-learning/${course.id}?lessonId=${lesson.id}` as any);
                    }
                  }}
                >
                  <View style={styles.lessonIcon}>
                    {isCompleted ? (
                      <CheckCircle2 color={colors.neonLime} size={18} />
                    ) : isAccessible ? (
                      <PlayCircle color={colors.neonPurple} size={18} />
                    ) : (
                      <Lock color={colors.mutedForeground} size={16} />
                    )}
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text
                      style={[styles.lessonTitle, !isAccessible && styles.lessonLocked]}
                      numberOfLines={2}
                    >
                      {idx + 1}. {lesson.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                      {lesson.duration && (
                        <View style={styles.lessonMeta}>
                          <Clock color={colors.mutedForeground} size={10} />
                          <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
                        </View>
                      )}
                      {hasQuiz && (
                        <View style={styles.quizBadge}>
                          <Text style={styles.quizBadgeText}>⚡ Quiz Included</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quizzes & Assessments Section */}
          {((course.quizzes?.length ?? 0) > 0 || course.lessons.some((l: any) => l.quiz)) && (
            <View style={styles.quizzesSection}>
              <Text style={styles.lessonsTitle}>⚔️ Quizzes & Assessments</Text>
              
              {/* Standalone course quizzes */}
              {course.quizzes?.map((quiz: any) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (isEnrolled) {
                      router.push(`/quiz/${quiz.id}` as any);
                    } else {
                      Alert.alert("Enrollment Required", "Enroll in this course to attempt quizzes.");
                    }
                  }}
                >
                  <View style={styles.quizCardLeft}>
                    <View style={styles.quizCardIconBox}>
                      <BookOpen color={colors.neonPurple} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizCardTitle}>{quiz.title}</Text>
                      <Text style={styles.quizCardSub}>
                        {quiz._count?.questions ?? 0} Questions • Pass {quiz.passingScore}%
                        {quiz.timeLimit > 0 ? ` • ⏱ ${quiz.timeLimit}m` : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={isEnrolled ? styles.startQuizPill : styles.lockedQuizPill}>
                    <Text style={isEnrolled ? styles.startQuizPillText : styles.lockedQuizPillText}>
                      {isEnrolled ? "Attempt" : "Locked"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Lesson-attached quizzes */}
              {course.lessons
                .filter((l: any) => l.quiz)
                .map((l: any) => (
                  <TouchableOpacity
                    key={l.quiz.id}
                    style={styles.quizCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (isEnrolled) {
                        router.push(`/quiz/${l.quiz.id}` as any);
                      } else {
                        Alert.alert("Enrollment Required", "Enroll in this course to attempt quizzes.");
                      }
                    }}
                  >
                    <View style={styles.quizCardLeft}>
                      <View style={styles.quizCardIconBox}>
                        <BookOpen color={colors.neonCyan} size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quizCardTitle}>{l.quiz.title}</Text>
                        <Text style={styles.quizCardSub}>
                          Lesson: {l.title} • Pass {l.quiz.passingScore}%
                        </Text>
                      </View>
                    </View>
                    <View style={isEnrolled ? styles.startQuizPill : styles.lockedQuizPill}>
                      <Text style={isEnrolled ? styles.startQuizPillText : styles.lockedQuizPillText}>
                        {isEnrolled ? "Attempt" : "Locked"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      <RazorpayCheckoutModal
        visible={checkoutVisible}
        orderData={razorpayOrder}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={handlePaymentSuccess}
        onFailure={(err) => {
          Alert.alert("Payment Failed", err?.description || "Razorpay transaction was not completed.");
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: fonts.body, color: colors.mutedForeground, fontSize: fontSizes.base },
  backBtn: {
    position: "absolute",
    top: spacing[4],
    left: spacing[4],
    zIndex: 10,
    backgroundColor: colors.background + "cc",
    padding: spacing[2],
    borderRadius: radii.full,
  },
  thumbContainer: { height: 240, position: "relative" },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },
  body: { padding: spacing[5], gap: spacing[4] },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  title: { fontFamily: fonts.display, fontSize: fontSizes["2xl"], color: colors.foreground, letterSpacing: 1, lineHeight: 36 },
  description: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.mutedForeground, lineHeight: 22 },
  meta: { flexDirection: "row", gap: spacing[4] },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  progressSection: {
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neonLime + "30",
  },
  enrollSection: { gap: spacing[3] },
  priceTag: { fontFamily: fonts.display, fontSize: fontSizes["2xl"], color: colors.neonAmber, letterSpacing: 2 },
  lessonsSection: { gap: spacing[3], marginTop: spacing[2] },
  lessonsTitle: { fontFamily: fonts.display, fontSize: fontSizes.base, color: colors.foreground, letterSpacing: 2 },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonIcon: { width: 24, alignItems: "center" },
  lessonInfo: { flex: 1, gap: 2 },
  lessonTitle: { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.foreground },
  lessonLocked: { color: colors.mutedForeground },
  lessonMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  lessonDuration: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  quizBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  quizBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonPurple,
  },

  // Quizzes & Assessments Section
  quizzesSection: {
    gap: spacing[3],
    marginTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[4],
  },
  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[3],
    backgroundColor: colors.surface2,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    gap: spacing[3],
  },
  quizCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  quizCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quizCardTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
  },
  quizCardSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  startQuizPill: {
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  startQuizPillText: {
    fontFamily: fonts.display,
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  lockedQuizPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  lockedQuizPillText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
  },
});
