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
  Dimensions,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

const LOCAL_FAQS: {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}[] = [
  // 1. Academy Core & Mission
  {
    keywords: ["what is cyber tech", "about", "academy", "platform", "hunter", "cyber tech academy"],
    question: "What is Cyber Tech Academy?",
    answer: "Cyber Tech Academy is an elite Hunter-themed engineering platform where developers master real-world software engineering, level up combat skills in code, conquer chapter quizzes, and earn verifiable cryptographic Certificates of Mastery.",
    category: "Academy Intelligence",
  },
  // 2. Certifications
  {
    keywords: ["certificate", "cert", "completion", "verify", "exam", "pass", "download cert", "degree", "diploma"],
    question: "How do I earn and verify my Certificate of Mastery?",
    answer: "Completing 100% of the lessons and assessments in any course automatically generates an authenticated, digitally verifiable Certificate of Mastery with a unique serial ID, verification link, and high-resolution PDF download.",
    category: "Certifications",
  },
  // 3. Hunter Ranks & EXP
  {
    keywords: ["rank", "exp", "level", "hunter rank", "progression", "shadow monarch", "dungeon raider", "points"],
    question: "How does the Hunter Ranking & EXP system work?",
    answer: "You earn EXP by completing video lessons (+25 EXP), scoring high on chapter quizzes (+50 EXP), and completing entire masterclasses (+200 EXP).\n\nRank Tiers:\n• E-Rank Recruit\n• D-Rank Scout\n• C-Rank Striker\n• B-Rank Vanguard\n• A-Rank Elite\n• S-Rank Monarch!",
    category: "Hunter Progression",
  },
  // 4. HP & MP
  {
    keywords: ["hp", "mp", "streak", "focus", "stats", "overdrive", "mana", "health"],
    question: "What do HP (Focus) and MP (Streak) measure?",
    answer: "• HP (Focus): Measures video watch completeness and lesson thoroughness.\n• MP (Streak): Daily learning momentum. Studying consecutive days maintains your streak (7 days = 100% Overdrive mode).",
    category: "Hunter Progression",
  },
  // 5. Offline Downloads
  {
    keywords: ["offline", "download", "save video", "no internet", "sandbox", "airplane mode", "cache"],
    question: "Can I download lessons for offline study?",
    answer: "Yes! In the mobile app, tap the 'Save Offline' download button on any supported lesson. The video is securely cached to your sandboxed device storage for high-speed playback anywhere without an active internet connection.",
    category: "Mobile App",
  },
  // 6. Security & Screen Recording
  {
    keywords: ["screen recording", "screenshot", "black screen", "security policy", "flag secure", "drm", "record"],
    question: "Why is screen recording restricted on videos?",
    answer: "To protect proprietary academy syllabus and course content, our mobile media player enforces hardware-level secure window protection across full-screen playback. Screen recordings and screenshots result in a black screen by policy.",
    category: "Security Policy",
  },
  // 7. Payments & Pricing
  {
    keywords: ["payment", "razorpay", "upi", "card", "price", "buy course", "fees", "cost", "emi", "gpay", "phonepe"],
    question: "What payment methods are supported?",
    answer: "We support instant UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ banks, and International Cards via our 256-bit encrypted Razorpay gateway.",
    category: "Billing & Payments",
  },
  // 8. Lifetime Access vs Hunter Pass
  {
    keywords: ["access", "lifetime", "validity", "expiry", "subscription", "how long", "module", "pass"],
    question: "How long is my course access valid?",
    answer: "• Full Masterclass Purchases: Grant lifetime access with all future updates included.\n• Hunter Pass Topic Modules: Provide 1 full year of access with simple 1-click renewal.",
    category: "Enrollment & Validity",
  },
  // 9. Sync Across Devices
  {
    keywords: ["sync", "web and mobile", "switch device", "progress", "pc", "laptop", "tablet"],
    question: "Can I switch between web and mobile devices?",
    answer: "Yes! Your account, EXP points, lesson watch progress, and unlocked badges synchronize automatically across the web platform and mobile app in real time.",
    category: "Platform Intelligence",
  },
  // 10. Human Instructor & Support
  {
    keywords: ["support", "ticket", "help", "contact", "instructor", "stuck", "doubt", "talk to human", "phone", "email"],
    question: "How do I connect with an instructor or get live help?",
    answer: "You can open a priority live support ticket anytime from the 'Help & Support' tab or click 'Escalate to Support' directly inside this chat. Our engineering instructors review questions within 2-4 hours.",
    category: "Live Support",
  },
  // 11. Coding: JavaScript
  {
    keywords: ["javascript", "js", "closure", "prototype", "hoisting", "event loop", "var", "let", "const"],
    question: "What is JavaScript and how do closures work?",
    answer: "JavaScript is a versatile, event-driven language powering modern web & mobile apps.\n\n• Closures: An inner function that retains access to variables from its outer enclosing scope even after the outer function has finished executing.",
    category: "JavaScript Masterclass",
  },
  // 12. Coding: React & React Native
  {
    keywords: ["react", "react native", "hooks", "usestate", "useeffect", "usememo", "virtual dom", "props", "state"],
    question: "How do React State and Hooks work?",
    answer: "• useState: Declares reactive state variables inside functional components.\n• useEffect: Performs side effects (fetching data, timers, subscriptions).\n• useMemo / useCallback: Optimizes performance by memoizing computed values and callback functions across re-renders.",
    category: "React Intelligence",
  },
  // 13. Coding: TypeScript
  {
    keywords: ["typescript", "ts", "interface", "generic", "types", "type safety", "any"],
    question: "What are the benefits of TypeScript?",
    answer: "TypeScript is a strongly typed superset of JavaScript that catches bugs at compile time. It delivers rich IDE autocompletion, robust interface contracts, and reusable generic abstractions for mission-critical codebases.",
    category: "TypeScript Masterclass",
  },
  // 14. Coding: Next.js & Server Components
  {
    keywords: ["nextjs", "next.js", "ssr", "ssg", "server component", "app router", "hydration"],
    question: "What is Next.js and why use Server Components?",
    answer: "Next.js is a full-stack React framework providing SSR, SSG, and React Server Components (RSC). Server Components execute exclusively on the server, minimizing client bundle sizes and dramatically speeding up page loads and SEO.",
    category: "Next.js Architecture",
  },
  // 15. Coding: Node.js & Backend
  {
    keywords: ["node", "nodejs", "backend", "express", "nestjs", "rest api", "event loop"],
    question: "How does the Node.js Event Loop work?",
    answer: "Node.js runs single-threaded JavaScript on the V8 engine and handles asynchronous non-blocking I/O via libuv worker threads. This allows backend services to efficiently process thousands of concurrent network connections.",
    category: "Backend Engineering",
  },
  // 16. Coding: Python & AI
  {
    keywords: ["python", "pip", "django", "fastapi", "machine learning", "ai", "pandas", "pytorch"],
    question: "Why is Python widely used for Backend & AI?",
    answer: "Python provides clean, expressive syntax combined with a massive ecosystem: FastAPI and Django for high-concurrency APIs, plus PyTorch, TensorFlow, and Pandas for Machine Learning, Data Science, and AI agent engineering.",
    category: "Python & AI",
  },
  // 17. Coding: Git & Version Control
  {
    keywords: ["git", "github", "commit", "branch", "pull request", "merge", "rebase", "git command"],
    question: "What are essential Git commands for developers?",
    answer: "• git clone <url>: Clone repository.\n• git checkout -b <branch>: Create and switch branch.\n• git add . && git commit -m 'feat: ...': Stage and commit.\n• git push origin <branch>: Push to remote.\n• git pull --rebase: Sync clean upstream changes.",
    category: "DevOps & Tools",
  },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
  "in", "on", "at", "to", "for", "with", "about", "by", "from", "of",
  "how", "what", "why", "when", "where", "who", "which", "can", "do",
  "does", "did", "i", "you", "my", "me", "we", "they", "this", "that",
  "please", "tell", "explain", "help", "know", "want"
]);

function searchLocalKnowledge(rawQuery: string, courseTitle?: string, lessonTitle?: string) {
  const queryLower = rawQuery.toLowerCase().trim();
  const normalized = queryLower.replace(/[^\w\s]/g, "").trim();

  // Greetings & Conversational
  if (["hi", "hello", "hey", "hola", "greetings", "yo", "sup"].includes(normalized)) {
    return {
      answer: "Greetings Hunter! ⚔️ I am ALEX, your AI Tactical Assistant. Ask me anything about course lessons, coding concepts (JS, React, Python, Backend), certificates, exams, or academy guidance!",
      matchedQuestion: "Greetings",
      source: "ALEX AI Tutor",
      confidence: "HIGH",
    };
  }

  if (["who are you", "what is your name", "what can you do", "what are you", "help me"].includes(normalized)) {
    return {
      answer: "I am ALEX, the Academy's AI Tactical Tutor! 🤖\n\nI provide 24/7 assistance on:\n• Course curriculum & lesson breakdowns\n• Code debugging & programming explanations (JavaScript, TypeScript, React, Python, Databases)\n• Quizzes, Certifications, and Hunter Rank guides\n• 1-tap support escalation if you need human instructor review.",
      matchedQuestion: "About Assistant",
      source: "ALEX AI Tutor",
      confidence: "HIGH",
    };
  }

  if (["thanks", "thank you", "thx", "appreciate it", "great"].includes(normalized)) {
    return {
      answer: "You're welcome, Hunter! Keep pushing your skills forward. Let me know if you need any other tactical guidance! 🚀",
      matchedQuestion: "Acknowledgment",
      source: "ALEX AI Tutor",
      confidence: "HIGH",
    };
  }

  const words = queryLower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  let bestMatch: any = null;
  let highestScore = 0;

  for (const faq of LOCAL_FAQS) {
    let score = 0;
    const qLower = faq.question.toLowerCase();
    const aLower = faq.answer.toLowerCase();

    if (qLower.includes(queryLower) || queryLower.includes(qLower)) score += 20;

    for (const kw of faq.keywords) {
      if (queryLower.includes(kw) || kw.includes(queryLower)) score += 12;
    }

    for (const word of words) {
      if (qLower.includes(word)) score += 5;
      if (faq.keywords.some((k) => k.includes(word))) score += 4;
      if (aLower.includes(word)) score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        answer: faq.answer,
        matchedQuestion: faq.question,
        source: faq.category,
        confidence: score >= 10 ? "HIGH" : "MEDIUM",
      };
    }
  }

  if (bestMatch && highestScore >= 4) {
    return bestMatch;
  }

  // Course / Lesson Contextual Fallback
  const contextPrefix = lessonTitle
    ? `Regarding your question in "${lessonTitle}":`
    : courseTitle
    ? `Regarding your inquiry for "${courseTitle}":`
    : "Here is tactical guidance for your inquiry:";

  return {
    answer: `${contextPrefix}\n\n• Ensure all prerequisite concepts in earlier lessons are completed.\n• For code exercises, verify syntax, type safety, and async operations.\n• Check lesson attachments and downloadable resource notes.\n• Need human instructor clarification? Tap 'Escalate to Support' below to open an immediate priority ticket!`,
    matchedQuestion: rawQuery,
    source: "Tactical Knowledge Engine",
    confidence: "MEDIUM",
  };
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
      if (data?.answer || data?.message) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.answer || data.message,
          source: data.source || "Knowledge Base",
          confidence: data.confidence || "HIGH",
          matchedQuestion: data.matchedQuestion,
          escalationNeeded: data.escalationNeeded,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }
      throw new Error("No answer from server");
    } catch {
      // Run intelligent local FAQ & knowledge matching fallback
      const localResult = searchLocalKnowledge(text, courseTitle, lessonTitle);
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: localResult.answer,
        source: localResult.source,
        confidence: localResult.confidence,
        matchedQuestion: localResult.matchedQuestion,
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
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
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
            keyboardShouldPersistTaps="handled"
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
    maxHeight: SCREEN_HEIGHT * 0.88,
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
    paddingBottom: spacing[4],
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

