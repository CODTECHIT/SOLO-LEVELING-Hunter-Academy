import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ChevronDown,
  Mail,
  Send,
  Headphones,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getPublicFaqsFn } from "@/server/courses";
import { getCurrentUserFn } from "@/server/auth";
import {
  getStudentSupportTicketsFn,
  getTicketDetailsFn,
  createSupportTicketFn,
  sendSupportMessageFn,
} from "@/server/support";
import type { SupportCategory, SupportPriority } from "@prisma/client";


export const Route = createFileRoute("/support")({
  loader: async () => {
    const { faqs } = await getPublicFaqsFn();
    const user = await getCurrentUserFn();
    let tickets: any[] = [];
    if (user) {
      try {
        const res = await getStudentSupportTicketsFn();
        tickets = res.tickets || [];
      } catch (e) {
        console.error("Failed to load tickets:", e);
      }
    }
    return { faqs, user, tickets };
  },
  head: () => ({
    meta: [{ title: "Customer Support & Live Help — Cyber Tech Academy" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { faqs, user, tickets: initialTickets } = Route.useLoaderData();
  const router = useRouter();

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<any[]>(initialTickets || []);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets?.[0]?.id || null
  );
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New ticket state (inline or modal)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<SupportCategory>("TECHNICAL");
  const [newPriority, setNewPriority] = useState<SupportPriority>("MEDIUM");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const [isNewTicketModal, setIsNewTicketModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync tickets with loader data
  useEffect(() => {
    if (initialTickets) {
      setTickets(initialTickets);
      if (initialTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(initialTickets[0].id);
      }
    }
  }, [initialTickets]);

  // Poll conversation for live messaging
  useEffect(() => {
    if (!selectedTicketId || !user) return;

    let isMounted = true;
    const fetchChat = async () => {
      try {
        const details = await getTicketDetailsFn({ data: { ticketId: selectedTicketId } });
        if (isMounted) setActiveTicket(details);
      } catch (err) {
        console.error("Live chat sync:", err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedTicketId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicketId || !replyText.trim() || isSending) return;

    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);

    try {
      await sendSupportMessageFn({
        data: { ticketId: selectedTicketId, message: text },
      });
      const updated = await getTicketDetailsFn({ data: { ticketId: selectedTicketId } });
      setActiveTicket(updated);
      router.invalidate();
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;

    setIsCreatingTicket(true);
    try {
      const created = await createSupportTicketFn({
        data: {
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          message: newInitialMsg.trim(),
        },
      });

      setIsNewTicketModal(false);
      setNewSubject("");
      setNewInitialMsg("");
      setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setSelectedTicketId(created.id);
      setActiveTicket(created);
      router.invalidate();
    } catch (err: any) {
      alert(err.message || "Failed to create support ticket");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-neon-amber/20 text-neon-amber border-neon-amber/40";
      case "IN_PROGRESS":
        return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40";
      case "RESOLVED":
        return "bg-neon-lime/20 text-neon-lime border-neon-lime/40";
      default:
        return "bg-surface text-muted-foreground border-border";
    }
  };

  return (
    <PageShell
      title="Customer Support Desk"
      subtitle="Connect directly with our Technical Support Team via live messaging, or browse FAQs."
    >
      <div className="mx-auto max-w-5xl space-y-12 pb-16">
        {/* Live Support Portal for Logged in Users */}
        {user ? (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Live Support Chat & Tickets
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Direct communication channel with Technical Support.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setSelectedTicketId(null);
                  setIsNewTicketModal(true);
                }}
                className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Start New Conversation
              </Button>
            </div>

            {/* Live Chat Split View */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 rounded-2xl border border-border bg-surface overflow-hidden min-h-[520px]">
              {/* Left Column: My Tickets */}
              <div className="md:col-span-4 border-r border-border flex flex-col bg-surface-2/40">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    My Conversations ({tickets.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicketId(null);
                      setIsNewTicketModal(true);
                    }}
                    className="text-neon-cyan hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> New
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[460px]">
                  {tickets.map((t) => {
                    const isSelected = selectedTicketId === t.id;
                    const lastMsg = t.messages?.[0];
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTicketId(t.id);
                          setIsNewTicketModal(false);
                        }}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-surface-2 border-l-4 border-l-neon-cyan"
                            : "hover:bg-surface-2/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-neon-cyan">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${statusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground text-sm mt-1 truncate">
                          {t.subject}
                        </p>
                        {lastMsg && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {lastMsg.message}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {tickets.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground space-y-3">
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs font-semibold text-foreground">No Active Tickets</p>
                      <p className="text-[11px]">Click below or use the form on the right to start a chat.</p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedTicketId(null);
                          setIsNewTicketModal(true);
                        }}
                        className="bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 text-xs font-semibold mt-2"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Open Ticket
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Chat Stream or New Ticket Form */}
              <div className="md:col-span-8 flex flex-col bg-background/50">
                {selectedTicketId && activeTicket ? (
                  // Active Ticket Chat Thread
                  <>
                    <div className="p-4 border-b border-border bg-surface-2/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neon-cyan">
                            {activeTicket.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${statusBadge(
                              activeTicket.status
                            )}`}
                          >
                            {activeTicket.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="font-bold text-foreground text-base mt-0.5">
                          {activeTicket.subject}
                        </h4>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-neon-lime">
                        <span className="h-2 w-2 rounded-full bg-neon-lime animate-pulse" /> Live Support Connected
                      </span>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[380px]">
                      {activeTicket.messages?.map((msg: any) => {
                        const isStaff =
                          msg.senderRole === "ADMIN" ||
                          msg.senderRole === "TECHNICAL_TEAM" ||
                          msg.senderRole === "MANAGER" ||
                          msg.senderRole === "SUB_ADMIN";

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}
                          >
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[11px] font-bold text-foreground">
                                {isStaff ? "Technical Support Specialist" : "You"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                isStaff
                                  ? "bg-surface-2 border border-neon-cyan/40 text-foreground rounded-tl-none"
                                  : "bg-neon-purple text-white rounded-tr-none shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Send Message */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface-2/60">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                        />
                        <Button
                          type="submit"
                          disabled={isSending || !replyText.trim()}
                          className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  // Inline New Ticket Form (Always accessible when no ticket selected)
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="max-w-lg mx-auto w-full space-y-4">
                      <div className="border-b border-border pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-lg font-bold text-foreground">
                            Start New Support Conversation
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Our Technical Support Team typically replies within minutes.
                          </p>
                        </div>
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      </div>

                      <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Subject / Issue Summary *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Video buffering on Lesson 3, or Quiz submit error"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Category
                            </label>
                            <select
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value as SupportCategory)}
                              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                            >
                              <option value="TECHNICAL">Technical Issue</option>
                              <option value="COURSE_CONTENT">Course / Quiz Question</option>
                              <option value="BILLING">Billing & Payments</option>
                              <option value="ACCOUNT">Account Access</option>
                              <option value="GENERAL">General Inquiry</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Priority
                            </label>
                            <select
                              value={newPriority}
                              onChange={(e) => setNewPriority(e.target.value as SupportPriority)}
                              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Detailed Description *
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Describe your issue or question in detail so our technical team can assist you immediately..."
                            value={newInitialMsg}
                            onChange={(e) => setNewInitialMsg(e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isCreatingTicket || !newSubject.trim() || !newInitialMsg.trim()}
                          className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold py-2.5"
                        >
                          {isCreatingTicket ? "Submitting..." : "Send Message to Technical Support →"}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <Panel accent="purple" className="text-center p-8 space-y-4">
            <Headphones className="h-12 w-12 mx-auto text-neon-purple" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Sign In For Real-Time Live Support
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Logged in students have instant access to our direct live support chat with the Technical Team.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                type="button"
                onClick={() => router.navigate({ to: "/login" })}
                className="bg-neon-purple text-white hover:bg-neon-purple/90"
              >
                Log In to Open Live Chat
              </Button>
            </div>
          </Panel>
        )}

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-neon-cyan" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-border/80"
              >
                <button
                  type="button"
                  className="w-full text-left p-5 flex items-center justify-between font-bold text-foreground hover:bg-background/50 cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.question}
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-muted-foreground text-sm border-t border-border/50 bg-background/30 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No FAQs available yet. Check back soon.
              </p>
            )}
          </div>
        </section>

        {/* Contact info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Panel accent="cyan" className="text-center p-6 space-y-2">
            <Mail className="mx-auto h-8 w-8 text-neon-cyan mb-2" />
            <p className="font-bold text-foreground">Official Email Support</p>
            <p className="text-xs text-muted-foreground">Responses typically within 24 hours</p>
            <a
              href="mailto:cybertechacademy123@gmail.com"
              className="text-neon-cyan hover:underline text-sm font-semibold block pt-1"
            >
              cybertechacademy123@gmail.com
            </a>
          </Panel>

          <Panel accent="lime" className="text-center p-6 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366] mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.573c-.199 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <p className="font-bold text-foreground">WhatsApp Channel</p>
            <p className="text-xs text-muted-foreground">Quick text inquiries</p>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline text-sm font-semibold block pt-1"
            >
              Open WhatsApp Chat →
            </a>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
