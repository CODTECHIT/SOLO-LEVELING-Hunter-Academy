import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Bot,
  Send,
  X,
  Sparkles,
  HelpCircle,
  Headphones,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { useRouter } from "expo-router";

interface CourseAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  initialQuery?: string;
}

export function CourseAssistantModal({
  visible,
  onClose,
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  initialQuery,
}: CourseAssistantModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [escalating, setEscalating] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);

  const quickPrompts = [
    "What courses are available?",
    "How to get a certificate?",
    "Payment methods supported",
    "Offline download study",
  ];

  const handleSearch = async (searchQuery = query) => {
    const textToSearch = searchQuery.trim();
    if (!textToSearch || loading) return;

    setLoading(true);
    setResult(null);
    setTicketCreated(null);
    setFeedbackGiven(false);

    try {
      const res = await api.post("/assistant/query", {
        courseId,
        lessonId,
        query: textToSearch,
      });
      setResult(res.data);
    } catch {
      setResult({
        match: false,
        escalationNeeded: true,
        message: "Unable to retrieve knowledge base right now. Would you like to raise a support ticket?",
        suggestedSubject: `Lesson Doubt: ${lessonTitle || courseTitle || "General"}`,
        originalQuery: textToSearch,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEscalateToSupport = async () => {
    setEscalating(true);
    try {
      const subject = `Lesson Doubt: ${lessonTitle || courseTitle || "Course Question"}`;
      const msgContent = `[Automated Knowledge Base Escalation]\nCourse: ${courseTitle || courseId}\nLesson: ${lessonTitle || "General"}\nStudent Question:\n"${query || result?.originalQuery || "Need instructor clarification"}"`;

      const res = await api.post("/support/tickets", {
        subject,
        category: "ACADEMIC",
        priority: "MEDIUM",
        message: msgContent,
      });

      setTicketCreated(res.data?.ticketNumber || "SUBMITTED");
    } catch (err) {
      // If error, redirect to support tab
      onClose();
      router.push("/support" as any);
    } finally {
      setEscalating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.botIconBadge}>
                <Bot color={colors.neonCyan} size={18} />
              </View>
              <View>
                <Text style={styles.title}>AI Tactical Assistant</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {lessonTitle ? `Knowledge for: ${lessonTitle}` : "Course Knowledge Base"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Quick Prompts */}
            <Text style={styles.sectionLabel}>QUICK INQUIRY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {quickPrompts.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  activeOpacity={0.7}
                  onPress={() => {
                    setQuery(prompt);
                    handleSearch(prompt);
                  }}
                >
                  <Sparkles size={11} color={colors.neonCyan} />
                  <Text style={styles.chipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Results Section */}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.neonCyan} size="small" />
                <Text style={styles.loadingText}>Scanning syllabus & knowledge base...</Text>
              </View>
            )}

            {!loading && result && (
              <View style={styles.resultContainer}>
                {result.match ? (
                  <View style={styles.matchCard}>
                    <View style={styles.matchHeader}>
                      <View style={styles.sourceBadge}>
                        <BookOpen color={colors.neonLime} size={12} />
                        <Text style={styles.sourceBadgeText}>{result.source || "Knowledge Base"}</Text>
                      </View>
                      {result.confidence === "HIGH" && (
                        <Text style={styles.confidenceTag}>Verified Match</Text>
                      )}
                    </View>

                    {result.matchedQuestion && (
                      <Text style={styles.matchedQuestion}>💡 {result.matchedQuestion}</Text>
                    )}

                    <Text style={styles.answerText}>{result.answer}</Text>

                    {/* Feedback row */}
                    {!feedbackGiven ? (
                      <View style={styles.feedbackRow}>
                        <Text style={styles.feedbackLabel}>Did this help you?</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <TouchableOpacity
                            style={styles.feedbackBtn}
                            onPress={() => setFeedbackGiven(true)}
                          >
                            <ThumbsUp color={colors.neonLime} size={14} />
                            <Text style={[styles.feedbackBtnText, { color: colors.neonLime }]}>Yes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.feedbackBtn}
                            onPress={() => {
                              setFeedbackGiven(true);
                              setResult({ ...result, escalationNeeded: true });
                            }}
                          >
                            <ThumbsDown color={colors.destructive} size={14} />
                            <Text style={[styles.feedbackBtnText, { color: colors.destructive }]}>No</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.feedbackThankYou}>✓ Thanks for your feedback!</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.noMatchCard}>
                    <HelpCircle color={colors.neonAmber} size={28} style={{ marginBottom: 8 }} />
                    <Text style={styles.noMatchTitle}>No Direct Knowledge Match</Text>
                    <Text style={styles.noMatchDesc}>
                      {result.message || "This specific question isn't in the automated FAQ index."}
                    </Text>
                  </View>
                )}

                {/* Escalation to Support Team */}
                {result.escalationNeeded && (
                  <View style={styles.escalationCard}>
                    <View style={styles.escalationHeader}>
                      <Headphones color={colors.neonCyan} size={18} />
                      <Text style={styles.escalationTitle}>Connect with Academy Support</Text>
                    </View>
                    <Text style={styles.escalationText}>
                      Need human instructor assistance? We can raise a direct support ticket for this lesson.
                    </Text>

                    {ticketCreated ? (
                      <View style={styles.ticketSuccessBox}>
                        <CheckCircle2 color={colors.neonLime} size={18} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ticketSuccessTitle}>
                            Ticket Raised: {ticketCreated}
                          </Text>
                          <Text style={styles.ticketSuccessSubtitle}>
                            Our instructor team will respond in your Support dashboard.
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.viewTicketBtn}
                          onPress={() => {
                            onClose();
                            router.push("/support" as any);
                          }}
                        >
                          <Text style={styles.viewTicketBtnText}>View</Text>
                          <ChevronRight size={14} color="#050810" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.escalateActionBtn}
                        activeOpacity={0.85}
                        disabled={escalating}
                        onPress={handleEscalateToSupport}
                      >
                        {escalating ? (
                          <ActivityIndicator color="#050810" size="small" />
                        ) : (
                          <>
                            <Send color="#050810" size={16} />
                            <Text style={styles.escalateActionBtnText}>
                              Create Instructor Ticket
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {!result && !loading && (
              <View style={styles.emptyPromptState}>
                <Bot color={colors.mutedForeground} size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={styles.emptyPromptTitle}>Ask anything about this lesson</Text>
                <Text style={styles.emptyPromptSub}>
                  Queries are checked against course notes, FAQs, and syllabus knowledge.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Search Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question or topic..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !query.trim() && { opacity: 0.5 }]}
              onPress={() => handleSearch()}
              disabled={!query.trim() || loading}
            >
              <Send size={16} color="#050810" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: "75%",
    backgroundColor: "#121124",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.25)",
    padding: spacing[4],
    paddingBottom: Platform.OS === "ios" ? 34 : spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(62, 58, 96, 0.5)",
    marginBottom: spacing[2],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flex: 1,
  },
  botIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(103, 232, 249, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.neonCyan,
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    maxWidth: 240,
  },
  closeBtn: {
    padding: 6,
  },
  sectionLabel: {
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    marginVertical: 6,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(103, 232, 249, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.25)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.neonCyan,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
  },
  resultContainer: {
    marginTop: spacing[1],
    gap: spacing[2],
  },
  matchCard: {
    backgroundColor: "#1a1629",
    borderWidth: 1,
    borderColor: "rgba(103, 232, 249, 0.3)",
    borderRadius: radii.md,
    padding: spacing[4],
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(163, 230, 53, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: colors.neonLime,
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
  },
  confidenceTag: {
    color: colors.neonCyan,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  matchedQuestion: {
    color: colors.neonCyan,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    marginBottom: 6,
  },
  answerText: {
    color: colors.foreground,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: "rgba(62, 58, 96, 0.5)",
  },
  feedbackLabel: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
  },
  feedbackBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
  },
  feedbackThankYou: {
    marginTop: spacing[2],
    color: colors.neonLime,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  noMatchCard: {
    backgroundColor: "#1a1629",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    borderRadius: radii.md,
    padding: spacing[4],
    alignItems: "center",
  },
  noMatchTitle: {
    color: colors.neonAmber,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    fontWeight: "bold",
    marginBottom: 4,
  },
  noMatchDesc: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
  escalationCard: {
    backgroundColor: "#18142a",
    borderWidth: 1,
    borderColor: "rgba(176, 96, 240, 0.35)",
    borderRadius: radii.md,
    padding: spacing[4],
  },
  escalationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  escalationTitle: {
    color: colors.neonPurple,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
  },
  escalationText: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    marginBottom: spacing[2],
    lineHeight: 16,
  },
  escalateActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.neonCyan,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  escalateActionBtnText: {
    color: "#050810",
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
  },
  ticketSuccessBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.3)",
    borderRadius: radii.sm,
    padding: 10,
  },
  ticketSuccessTitle: {
    color: colors.neonLime,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
  },
  ticketSuccessSubtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  viewTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neonLime,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewTicketBtnText: {
    color: "#050810",
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
  },
  emptyPromptState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyPromptTitle: {
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: fontSizes.base,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emptyPromptSub: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textAlign: "center",
    maxWidth: 260,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: "rgba(62, 58, 96, 0.5)",
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.foreground,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    backgroundColor: colors.neonCyan,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
