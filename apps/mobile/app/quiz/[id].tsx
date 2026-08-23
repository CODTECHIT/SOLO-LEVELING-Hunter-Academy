import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Clock, CheckCircle2, Trophy, RotateCcw, AlertCircle } from "lucide-react-native";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePreventScreenCapture } from "expo-screen-capture";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { api } from "@/lib/api";

import { cyberAlert } from "@/store/alertStore";

export default function MobileQuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Screen recording and screenshot restriction for exams
  usePreventScreenCapture("quiz_exam_screen");

  const [quiz, setQuiz] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stage, setStage] = useState<"PREVIEW" | "IN_PROGRESS" | "RESULT">("PREVIEW");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const fetchQuiz = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data);
      if (res.data.timeLimit > 0) {
        setSecondsRemaining(res.data.timeLimit * 60);
      }
    } catch (err) {
      cyberAlert("Assessment Error", "Could not load quiz details from server.", undefined, "error");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchQuiz();
  }, [id]);

  const onRefresh = () => {
    if (stage === "PREVIEW") {
      setRefreshing(true);
      fetchQuiz();
    }
  };

  useEffect(() => {
    if (stage !== "IN_PROGRESS" || !quiz || quiz.timeLimit <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, quiz?.timeLimit]);

  const handleStart = () => {
    setSelectedAnswers({});
    setCurrentQIndex(0);
    if (quiz?.timeLimit > 0) setSecondsRemaining(quiz.timeLimit * 60);
    setResult(null);
    setStage("IN_PROGRESS");
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || isSubmitting) return;

    setIsSubmitting(true);
    const answersArray = (quiz.questions || []).map((q: any) => ({
      questionId: q.id,
      selectedOptionId: selectedAnswers[q.id] || null,
    }));

    try {
      const res = await api.post(`/quizzes/${quiz.id}/submit`, {
        answers: answersArray,
      });
      setResult(res.data);
      setStage("RESULT");
    } catch (err: any) {
      cyberAlert("Submission Failed", "Failed to submit assessment answers. Please try again.", undefined, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.neonPurple} />
        </View>
      </SafeScreen>
    );
  }

  if (!quiz) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={{ color: colors.foreground }}>Quiz not found.</Text>
        </View>
      </SafeScreen>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentQIndex];

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={22} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {quiz.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          stage === "PREVIEW" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.neonCyan}
              colors={[colors.neonCyan, colors.neonPurple]}
            />
          ) : undefined
        }
      >
        {/* ---------------- PREVIEW ---------------- */}
        {stage === "PREVIEW" && (
          <View style={styles.previewContainer}>
            <Card style={styles.introCard}>
              <Text style={styles.introCategory}>Assessment</Text>
              <Text style={styles.introTitle}>{quiz.title}</Text>
              {quiz.description && (
                <Text style={styles.introDesc}>{quiz.description}</Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Questions</Text>
                  <Text style={styles.statValue}>{questions.length}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Time Limit</Text>
                  <Text style={[styles.statValue, { color: colors.neonAmber }]}>
                    {quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : "None"}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Passing</Text>
                  <Text style={[styles.statValue, { color: colors.neonLime }]}>
                    {quiz.passingScore}%
                  </Text>
                </View>
              </View>

              <Button
                label="Start Assessment"
                variant="primary"
                disabled={questions.length === 0}
                onPress={handleStart}
                style={{ marginTop: spacing[5] }}
              />
            </Card>
          </View>
        )}

        {/* ---------------- IN PROGRESS ---------------- */}
        {stage === "IN_PROGRESS" && currentQ && (
          <View style={styles.progressContainer}>
            {/* Timer & Pagination Bar */}
            <View style={styles.topInfoBar}>
              <Text style={styles.qIndexText}>
                Question {currentQIndex + 1} of {questions.length}
              </Text>
              {quiz.timeLimit > 0 && (
                <View style={styles.timerTag}>
                  <Clock color={colors.neonAmber} size={14} />
                  <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
                </View>
              )}
            </View>

            {/* Question Card */}
            <Card style={styles.questionCard}>
              <Text style={styles.qText}>{currentQ.question}</Text>

              <View style={styles.optionsList}>
                {currentQ.options?.map((opt: any, idx: number) => {
                  const letters = ["A", "B", "C", "D", "E"];
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectOption(currentQ.id, opt.id)}
                    >
                      <View
                        style={[
                          styles.optionLetterBox,
                          isSelected && styles.optionLetterBoxSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetter,
                            isSelected && { color: "#ffffff" },
                          ]}
                        >
                          {letters[idx] || idx + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {opt.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Navigation Controls */}
              <View style={styles.navRow}>
                {currentQIndex > 0 && (
                  <Button
                    label="Previous"
                    variant="secondary"
                    onPress={() => setCurrentQIndex((prev) => prev - 1)}
                    style={{ flex: 1, marginRight: spacing[2] }}
                  />
                )}
                {currentQIndex < questions.length - 1 ? (
                  <Button
                    label="Next Question"
                    variant="primary"
                    onPress={() => setCurrentQIndex((prev) => prev + 1)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    label={isSubmitting ? "Scoring..." : "Submit Quiz"}
                    variant="primary"
                    disabled={isSubmitting}
                    onPress={handleSubmitQuiz}
                    style={{ flex: 1, backgroundColor: colors.neonLime }}
                  />
                )}
              </View>
            </Card>
          </View>
        )}

        {/* ---------------- RESULT ---------------- */}
        {stage === "RESULT" && result && (
          <View style={styles.resultContainer}>
            <Card style={styles.resultCard}>
              <View style={styles.trophyBox}>
                <Trophy
                  color={result.passed ? colors.neonLime : colors.neonAmber}
                  size={42}
                />
              </View>
              <Text style={styles.resultBadge}>
                {result.passed ? "ASSESSMENT PASSED" : "NEEDS IMPROVEMENT"}
              </Text>
              <Text style={styles.resultScore}>
                {result.score} / {result.totalMarks} ({result.percentage}%)
              </Text>
              <Text style={styles.resultPassingText}>
                Required passing grade: {result.passingScore}%
              </Text>

              <View style={styles.resultActions}>
                <Button
                  label="Retake Quiz"
                  variant="secondary"
                  onPress={handleStart}
                  style={{ flex: 1, marginRight: spacing[2] }}
                />
                <Button
                  label="Back"
                  variant="primary"
                  onPress={() => router.back()}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
  },
  content: {
    padding: spacing[4],
  },
  previewContainer: {
    paddingTop: spacing[2],
  },
  introCard: {
    padding: spacing[5],
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  introCategory: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xs,
    color: colors.neonPurple,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  introTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    fontWeight: "bold",
    marginTop: spacing[1],
  },
  introDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[5],
  },
  statBox: {
    flex: 1,
    padding: spacing[3],
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
    marginTop: 2,
  },
  progressContainer: {},
  topInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  qIndexText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  timerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.neonAmber + "20",
    borderColor: colors.neonAmber + "40",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  timerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonAmber,
    fontWeight: "bold",
  },
  questionCard: {
    padding: spacing[5],
  },
  qText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
    lineHeight: 24,
    marginBottom: spacing[4],
  },
  optionsList: {
    gap: 10,
    marginBottom: spacing[6],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowSelected: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurple + "15",
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterBoxSelected: {
    backgroundColor: colors.neonPurple,
  },
  optionLetter: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    fontWeight: "bold",
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  optionTextSelected: {
    fontWeight: "600",
    color: colors.foreground,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  resultContainer: {},
  resultCard: {
    padding: spacing[6],
    alignItems: "center",
  },
  trophyBox: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  resultBadge: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.display,
    color: colors.neonLime,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  resultScore: {
    fontFamily: fonts.display,
    fontSize: fontSizes["2xl"],
    color: colors.foreground,
    fontWeight: "bold",
    marginTop: spacing[2],
  },
  resultPassingText: {
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  resultActions: {
    flexDirection: "row",
    marginTop: spacing[6],
    width: "100%",
  },
});

