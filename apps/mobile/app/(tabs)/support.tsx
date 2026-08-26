import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headphones,
  RefreshCw,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cyberAlert } from "@/store/alertStore";

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New ticket modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const flatListRef = useRef<FlatList | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await api.get("/support/my-tickets");
      setTickets(res.data || []);
      if (res.data && res.data.length > 0 && !selectedTicket) {
        fetchTicketDetails(res.data[0].id);
      }
    } catch (e) {
      console.log("Fetch tickets error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
    } catch (e: any) {
      cyberAlert("Support Error", "Could not load ticket messages.", undefined, "error");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Real-time polling for active chat conversation
  useEffect(() => {
    if (!selectedTicket?.id) return;

    const interval = setInterval(() => {
      api
        .get(`/support/tickets/${selectedTicket.id}`)
        .then((res) => setSelectedTicket(res.data))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTicket?.id]);

  const handleSendMessage = async () => {
    if (!selectedTicket?.id || !replyText.trim() || isSending) return;

    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);

    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: text,
      });
      const res = await api.get(`/support/tickets/${selectedTicket.id}`);
      setSelectedTicket(res.data);
    } catch (e) {
      cyberAlert("Message Failed", "Failed to deliver message.", undefined, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      cyberAlert("Required Fields", "Please fill in both a subject and issue description.", undefined, "warning");
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.post("/support/tickets", {
        subject: subject.trim(),
        category,
        message: message.trim(),
      });

      setIsModalVisible(false);
      setSubject("");
      setMessage("");
      fetchTickets();
      setSelectedTicket(res.data);
      cyberAlert("Ticket Created", "Support ticket opened. A specialist will assist you shortly.", undefined, "success");
    } catch (e: any) {
      cyberAlert("Ticket Failed", e.response?.data?.message || "Failed to create support ticket.", undefined, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
          <ArrowLeft color={colors.foreground} size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Live Support</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {selectedTicket ? (
          // Active Live Chat Thread View
          <View style={styles.chatContainer}>
            {/* Conversation Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.closeChatBtn}
                onPress={() => setSelectedTicket(null)}
              >
                <ArrowLeft color={colors.foreground} size={18} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginHorizontal: spacing[2] }}>
                <Text style={styles.chatTicketNumber}>
                  {selectedTicket.ticketNumber} • {selectedTicket.category}
                </Text>
                <Text style={styles.chatSubject} numberOfLines={1}>
                  {selectedTicket.subject}
                </Text>
              </View>
              <View style={[styles.liveDot, { backgroundColor: colors.neonLime }]} />
            </View>

            {/* Message Stream */}
            <FlatList
              ref={flatListRef}
              data={selectedTicket.messages || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isStaff =
                  item.senderRole === "ADMIN" ||
                  item.senderRole === "TECHNICAL_TEAM" ||
                  item.senderRole === "MANAGER" ||
                  item.senderRole === "SUB_ADMIN";

                return (
                  <View
                    style={[
                      styles.messageRow,
                      isStaff ? styles.messageRowStaff : styles.messageRowUser,
                    ]}
                  >
                    <Text style={styles.senderLabel}>
                      {isStaff ? "Technical Support" : "You"}
                    </Text>
                    <View
                      style={[
                        styles.bubble,
                        isStaff ? styles.bubbleStaff : styles.bubbleUser,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isStaff ? styles.bubbleTextStaff : styles.bubbleTextUser,
                        ]}
                      >
                        {item.message}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor={colors.mutedForeground}
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !replyText.trim() && { opacity: 0.5 },
                ]}
                disabled={!replyText.trim() || isSending}
                onPress={handleSendMessage}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Send color={colors.background} size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Main Support Screen (Tickets list + Quick Actions)
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchTickets}
                tintColor={colors.neonCyan}
                colors={[colors.neonCyan, colors.neonPurple]}
              />
            }
          >
            {/* Start Live Chat Card */}
            <Card style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={styles.heroIconBox}>
                  <Headphones color={colors.neonCyan} size={28} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Live Technical Support</Text>
                  <Text style={styles.heroSubtitle}>
                    Chat directly with our specialists for instant query resolution.
                  </Text>
                </View>
              </View>
              <Button
                label="+ Start New Live Ticket"
                variant="primary"
                onPress={() => setIsModalVisible(true)}
                style={styles.newTicketBtn}
              />

            </Card>

            {/* Active Tickets List */}
            {tickets.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Active Conversations</Text>
                {tickets.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.ticketCard}
                    activeOpacity={0.7}
                    onPress={() => fetchTicketDetails(t.id)}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketNum}>{t.ticketNumber}</Text>
                      <Badge
                        label={t.status.replace("_", " ")}
                        variant={
                          t.status === "RESOLVED"
                            ? "lime"
                            : t.status === "IN_PROGRESS"
                            ? "cyan"
                            : "amber"
                        }
                      />

                    </View>
                    <Text style={styles.ticketSubject} numberOfLines={1}>
                      {t.subject}
                    </Text>
                    {t.messages?.[0] && (
                      <Text style={styles.ticketLastMsg} numberOfLines={1}>
                        {t.messages[0].message}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Contact Fallbacks */}
            <Text style={[styles.sectionTitle, { marginTop: spacing[6] }]}>
              Other Ways to Reach Us
            </Text>

            <Card style={styles.contactCard}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL("mailto:cybertechacademysupport@gmail.com")}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Mail color={colors.neonPurple} size={22} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>Email Support</Text>
                  <Text style={styles.contactDesc}>cybertechacademysupport@gmail.com</Text>
                </View>
              </TouchableOpacity>
            </Card>

            <Card style={styles.contactCard}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL("https://wa.me/1234567890")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: colors.neonLime + "20", borderColor: colors.neonLime },
                  ]}
                >
                  <MessageCircle color={colors.neonLime} size={22} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>WhatsApp Support</Text>
                  <Text style={styles.contactDesc}>Instant text updates</Text>
                </View>
              </TouchableOpacity>
            </Card>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* ---------------- NEW TICKET MODAL ---------------- */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Open Support Ticket</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color={colors.mutedForeground} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Subject / Topic *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Video playback buffering in Chapter 2"
              placeholderTextColor={colors.mutedForeground}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.fieldLabel}>Detailed Message *</Text>
            <TextInput
              style={[styles.modalInput, { height: 100, textAlignVertical: "top" }]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={message}
              onChangeText={setMessage}
            />

            <Button
              label={isCreating ? "Submitting..." : "Send to Technical Team"}
              variant="primary"
              disabled={isCreating}
              onPress={handleCreateTicket}
              style={{ marginTop: spacing[4] }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
  },
  content: {
    padding: spacing[4],
    paddingBottom: 110,
  },
  heroCard: {
    padding: spacing[4],
    backgroundColor: colors.surface2,
    borderColor: colors.neonCyan + "40",
    borderWidth: 1,
    borderRadius: radii.xl,
    marginBottom: spacing[6],
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.neonCyan + "20",
    borderWidth: 1,
    borderColor: colors.neonCyan,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    fontWeight: "bold",
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  newTicketBtn: {
    backgroundColor: colors.neonCyan,
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  ticketCard: {
    padding: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[1],
  },
  ticketNum: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  ticketSubject: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    fontWeight: "600",
  },
  ticketLastMsg: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  contactCard: {
    marginBottom: spacing[3],
    padding: spacing[1],
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[2],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.neonPurpleAlpha20 || "#a855f720",
    borderWidth: 1,
    borderColor: colors.neonPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    fontWeight: "bold",
  },
  contactDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
  },
  // Chat view styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    backgroundColor: colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeChatBtn: {
    padding: 6,
  },
  chatTicketNumber: {
    fontSize: 10,
    fontFamily: fonts.sans,
    color: colors.neonCyan,
    fontWeight: "bold",
  },
  chatSubject: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sans,
    color: colors.foreground,
    fontWeight: "bold",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  messageList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  messageRow: {
    marginBottom: spacing[2],
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowStaff: {
    alignItems: "flex-start",
  },
  senderLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.xl,
    maxWidth: "82%",
  },
  bubbleUser: {
    backgroundColor: colors.neonPurple,
    borderTopRightRadius: 2,
  },
  bubbleStaff: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#ffffff",
  },
  bubbleTextStaff: {
    color: colors.foreground,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing[2],
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    color: colors.foreground,
    fontSize: fontSizes.sm,
  },
  sendBtn: {
    backgroundColor: colors.neonCyan,
    padding: 10,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    fontWeight: "bold",
  },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: spacing[2],
  },
  modalInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: fontSizes.sm,
  },
});

