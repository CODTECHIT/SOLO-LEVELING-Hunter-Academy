import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  User,
  Shield,
  Zap,
} from "lucide-react-native";
import { api } from "@/lib/api";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { useRouter } from "expo-router";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  source?: string;
  confidence?: string;
  matchedQuestion?: string;
  time: string;
  escalationNeeded?: boolean;
}

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
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, boolean>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: lessonTitle
        ? `Greetings Hunter! ⚔️ I am ALEX, your AI Tactical Tutor. Ask me any question or doubt regarding "${lessonTitle}".`
        : "Greetings Hunter! ⚔️ I am ALEX, your 24/7 AI Tactical Tutor. Ask me anything about course lessons, coding concepts, certificates, quizzes, or academy progression!",
      source: "ALEX Core",
      confidence: "HIGH",
      time: "Just now",
    },
  ]);

  const quickPrompts = [
    "🎓 How to get Certificate?",
    "📚 Available Courses",
    "⚡ How does EXP/Rank work?",
    "💳 Payment Methods",
    "📥 Offline Video Downloads",
  ];

  useEffect(() => {
    if (visible && initialQuery && initialQuery.trim().length > 0) {
      sendMessage(initialQuery.trim());
    }
  }, [visible, initialQuery]);

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await api.post("/assistant/query", {
        courseId,
        lessonId,
        query: text,
      });

      const data = res.data;
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data?.answer || data?.message || "I found tactical guidance for your query.",
        source: data?.source || "Knowledge Base",
        confidence: data?.confidence || "HIGH",
        matchedQuestion: data?.matchedQuestion,
        escalationNeeded: data?.escalationNeeded,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "I'm experiencing high server traffic, but here is instant tactical guidance:\n\n• Ensure all prerequisite concepts in previous lessons are completed.\n• Check that your code syntax and async calls match current standards.\n• If you need human instructor guidance, tap 'Connect with Support' below!",
        source: "Offline AI Fallback",
        escalationNeeded: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleEscalateToSupport = async (lastUserQuestion?: string) => {
    setEscalating(true);
    try {
      const subject = `Lesson Doubt: ${lessonTitle || courseTitle || "Course Question"}`;
      const msgContent = `[AI Assistant Escalation]\nCourse: ${courseTitle || courseId || "General"}\nLesson: ${lessonTitle || "General"}\nStudent Question:\n"${lastUserQuestion || "Instructor clarification requested"}"`;

      const res = await api.post("/support/tickets", {
        subject,
        category: "ACADEMIC",
        priority: "MEDIUM",
        message: msgContent,
      });

      setTicketCreated(res.data?.ticketNumber || "SUBMITTED");
    } catch {
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
                <Bot color={colors.neonCyan} size={20} />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>ALEX • AI Teacher</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>ONLINE</Text>
                  </View>
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {lessonTitle ? `Knowledge for: ${lessonTitle}` : "Tactical Course & Tech Tutor"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          </View>

          {/* Quick Prompts Bar */}
          <View style={styles.quickPromptsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {quickPrompts.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  activeOpacity={0.7}
                  onPress={() => sendMessage(prompt.replace(/^[^\w]+/, ""))}
                >
                  <Sparkles size={11} color={colors.neonCyan} />
                  <Text style={styles.chipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender === "user" ? styles.userMsgWrapper : styles.botMsgWrapper,
                ]}
              >
                {msg.sender === "bot" && (
                  <View style={styles.botAvatar}>
                    <Bot color={colors.neonCyan} size={14} />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {/* Source & Verified header for bot messages */}
                  {msg.sender === "bot" && (
                    <View style={styles.botMetaRow}>
                      <View style={styles.sourceTag}>
                        <BookOpen color={colors.neonLime} size={10} />
                        <Text style={styles.sourceTagText}>{msg.source || "Knowledge Engine"}</Text>
                      </View>
                      <Text style={styles.timeText}>{msg.time}</Text>
                    </View>
                  )}

                  {msg.matchedQuestion && msg.matchedQuestion !== msg.text && (
                    <Text style={styles.matchedQuestionText}>💡 {msg.matchedQuestion}</Text>
                  )}

                  <Text style={msg.sender === "user" ? styles.userMsgText : styles.botMsgText}>
                    {msg.text}
                  </Text>

                  {/* Bot feedback buttons */}
                  {msg.sender === "bot" && msg.id !== "welcome-1" && (
                    <View style={styles.feedbackContainer}>
                      {!feedbackMap[msg.id] ? (
                        <View style={styles.feedbackRow}>
                          <Text style={styles.feedbackLabel}>Helpful?</Text>
                          <TouchableOpacity
                            style={styles.feedbackBtn}
                            onPress={() => setFeedbackMap((p) => ({ ...p, [msg.id]: true }))}
                          >
                            <ThumbsUp color={colors.neonLime} size={12} />
                            <Text style={[styles.feedbackBtnText, { color: colors.neonLime }]}>Yes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.feedbackBtn}
                            onPress={() => {
                              setFeedbackMap((p) => ({ ...p, [msg.id]: true }));
                              handleEscalateToSupport(msg.text);
                            }}
                          >
                            <ThumbsDown color={colors.destructive} size={12} />
                            <Text style={[styles.feedbackBtnText, { color: colors.destructive }]}>Doubt</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.feedbackDone}>✓ Feedback recorded</Text>
                      )}
                    </View>
                  )}
                </View>

                {msg.sender === "user" && (
                  <View style={styles.userAvatar}>
                    <User color="#050810" size={14} />
                  </View>
                )}
              </View>
            ))}

            {/* Typing indicator */}
            {loading && (
              <View style={styles.botMsgWrapper}>
                <View style={styles.botAvatar}>
                  <Bot color={colors.neonCyan} size={14} />
                </View>
                <View style={[styles.botBubble, styles.typingBubble]}>
                  <ActivityIndicator color={colors.neonCyan} size="small" />
                  <Text style={styles.typingText}>ALEX is analyzing syllabus & notes...</Text>
                </View>
              </View>
            )}

            {/* Ticket escalation banner if needed */}
            {ticketCreated && (
              <View style={styles.ticketBanner}>
                <CheckCircle2 color={colors.neonLime} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketBannerTitle}>Support Ticket #{ticketCreated} Created</Text>
                  <Text style={styles.ticketBannerSub}>Our instructor engineering team will reply in Support.</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask ALEX a question or doubt..."
              placeholderTextColor={colors.mutedForeground}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() || loading ? styles.sendBtnDisabled : styles.sendBtnActive]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#050810" size="small" />
              ) : (
                <Send color="#050810" size={16} />
              )}
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
    backgroundColor: "rgba(5, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: "85%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.25)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  botIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: "rgba(0, 243, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    fontWeight: "bold",
    color: colors.foreground,
    letterSpacing: 0.5,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neonLime,
  },
  onlineText: {
    fontFamily: fonts.display,
    fontSize: 8,
    fontWeight: "bold",
    color: colors.neonLime,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  closeBtn: {
    padding: spacing[2],
  },
  quickPromptsContainer: {
    paddingVertical: spacing[2],
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  chipsRow: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 243, 255, 0.08)",
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.2)",
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
    color: colors.neonCyan,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "92%",
  },
  userMsgWrapper: {
    alignSelf: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  botMsgWrapper: {
    alignSelf: "flex-start",
  },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.neonCyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  messageBubble: {
    padding: spacing[3],
    borderRadius: radii.xl,
  },
  userBubble: {
    backgroundColor: colors.neonCyan,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.15)",
    borderBottomLeftRadius: 4,
  },
  botMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
  },
  sourceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  sourceTagText: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.neonLime,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
  },
  matchedQuestionText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonPurple,
    marginBottom: 4,
  },
  userMsgText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: "#050810",
    fontWeight: "600",
    lineHeight: 18,
  },
  botMsgText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
  feedbackContainer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedbackLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  feedbackBtnText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: "bold",
  },
  feedbackDone: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonLime,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing[2],
  },
  typingText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
  },
  ticketBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
    borderRadius: radii.lg,
    padding: spacing[3],
    marginTop: 4,
  },
  ticketBannerTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    fontWeight: "bold",
    color: colors.neonLime,
  },
  ticketBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface2,
    gap: spacing[2],
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.2)",
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: colors.neonCyan,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(0, 243, 255, 0.3)",
    opacity: 0.6,
  },
});
