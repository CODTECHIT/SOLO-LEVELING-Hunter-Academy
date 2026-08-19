import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  getAdminSupportTicketsFn,
  getTicketDetailsFn,
  sendSupportMessageFn,
  updateTicketStatusFn,
} from "@/server/support";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Headphones,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Shield,
  MessageSquare,
  RefreshCw,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Tag,
} from "lucide-react";
import type { SupportStatus, SupportPriority, SupportCategory } from "@prisma/client";


export const Route = createFileRoute("/_admin/admin/academy/support")({
  loader: async () => {
    return await getAdminSupportTicketsFn();
  },
  head: () => ({
    meta: [{ title: "Customer Support Desk — Control Hub" }],
  }),
  component: AdminSupportDeskPage,
});

function AdminSupportDeskPage() {
  const { tickets, counts } = Route.useLoaderData();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets[0]?.id || null
  );
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Poll active ticket messages every 3 seconds for live chat experience
  useEffect(() => {
    if (!selectedTicketId) return;

    let isMounted = true;
    const fetchConversation = async () => {
      try {
        const details = await getTicketDetailsFn({ data: { ticketId: selectedTicketId } });
        if (isMounted) {
          setActiveTicket(details);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    fetchConversation();
    const interval = setInterval(fetchConversation, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedTicketId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicketId || !replyText.trim() || isSending) return;

    const textToSend = replyText.trim();
    setReplyText("");
    setIsSending(true);

    try {
      await sendSupportMessageFn({
        data: {
          ticketId: selectedTicketId,
          message: textToSend,
        },
      });
      // Fetch latest
      const updated = await getTicketDetailsFn({ data: { ticketId: selectedTicketId } });
      setActiveTicket(updated);
      router.invalidate();
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status: SupportStatus) => {
    if (!selectedTicketId) return;
    try {
      await updateTicketStatusFn({
        data: {
          ticketId: selectedTicketId,
          status,
        },
      });
      const updated = await getTicketDetailsFn({ data: { ticketId: selectedTicketId } });
      setActiveTicket(updated);
      router.invalidate();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
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
      case "CLOSED":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-surface text-muted-foreground border-border";
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "HIGH":
        return "text-neon-amber bg-neon-amber/10 border-neon-amber/30";
      case "MEDIUM":
        return "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30";
      default:
        return "text-muted-foreground bg-surface border-border";
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab !== "ALL" && t.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Technical Support Desk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time live messaging & issue resolution workspace for student queries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.invalidate()}
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Inbox
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("OPEN")}
          className={`cursor-pointer transition-all rounded-2xl border p-6 bg-surface ${
            activeTab === "OPEN" ? "border-neon-amber shadow-[0_0_12px_rgba(245,158,11,0.2)]" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                Open Tickets
              </p>
              <p className="font-display text-2xl font-bold text-neon-amber mt-1">{counts.open}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-amber/10 text-neon-amber border border-neon-amber/30">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("IN_PROGRESS")}
          className={`cursor-pointer transition-all rounded-2xl border p-6 bg-surface ${
            activeTab === "IN_PROGRESS" ? "border-neon-cyan shadow-[0_0_12px_rgba(6,182,212,0.2)]" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                In Progress
              </p>
              <p className="font-display text-2xl font-bold text-neon-cyan mt-1">{counts.inProgress}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("RESOLVED")}
          className={`cursor-pointer transition-all rounded-2xl border p-6 bg-surface ${
            activeTab === "RESOLVED" ? "border-neon-lime shadow-[0_0_12px_rgba(132,204,22,0.2)]" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                Resolved
              </p>
              <p className="font-display text-2xl font-bold text-neon-lime mt-1">{counts.resolved}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-lime/10 text-neon-lime border border-neon-lime/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>


      {/* Main Two-Column Chat Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left Column: Ticket Feed */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-border bg-surface overflow-hidden">
          {/* Filter & Search Header */}
          <div className="p-4 border-b border-border space-y-3 bg-surface-2/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    activeTab === tab
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40"
                      : "text-muted-foreground hover:bg-background/60"
                  }`}
                >
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {filteredTickets.map((t) => {
              const isSelected = selectedTicketId === t.id;
              const lastMsg = t.messages?.[0];
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-surface-2 border-l-4 border-l-neon-cyan"
                      : "hover:bg-surface-2/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-neon-cyan">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${statusBadge(
                          t.status
                        )}`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>

                  <h4 className="font-semibold text-foreground text-sm mt-1.5 truncate">
                    {t.subject}
                  </h4>

                  {lastMsg && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      <strong className="text-foreground/80 font-medium">
                        {lastMsg.sender?.role === "STUDENT" ? "Student" : "Staff"}:
                      </strong>{" "}
                      {lastMsg.message}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {t.user?.name || "Student"}
                    </span>
                    <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs font-semibold text-foreground">No tickets in this sector</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Conversation Workspace */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-border bg-surface overflow-hidden">
          {selectedTicketId && activeTicket ? (
            <>
              {/* Ticket Top Header & Actions */}
              <div className="p-4 border-b border-border bg-surface-2/50 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neon-cyan">
                      {activeTicket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${statusBadge(
                        activeTicket.status
                      )}`}
                    >
                      {activeTicket.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded bg-background/50 border border-border">
                      {activeTicket.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-base">{activeTicket.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>From: <strong>{activeTicket.user?.name}</strong> ({activeTicket.user?.email})</span>
                  </div>
                </div>

                {/* Status Quick Actions */}
                <div className="flex items-center gap-2">
                  {activeTicket.status !== "RESOLVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="bg-neon-lime/20 text-neon-lime border border-neon-lime/40 hover:bg-neon-lime/30 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Resolved
                    </Button>
                  )}
                  {activeTicket.status === "RESOLVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      variant="outline"
                      className="text-xs border-neon-cyan/40 text-neon-cyan"
                    >
                      Reopen Ticket
                    </Button>
                  )}
                  {activeTicket.status !== "CLOSED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateStatus("CLOSED")}
                      className="text-xs text-muted-foreground hover:text-red-400"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Live Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/40">
                {activeTicket.messages?.map((msg: any) => {
                  const isStaffMsg =
                    msg.senderRole === "ADMIN" ||
                    msg.senderRole === "TECHNICAL_TEAM" ||
                    msg.senderRole === "MANAGER" ||
                    msg.senderRole === "SUB_ADMIN";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaffMsg ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-foreground">
                          {isStaffMsg ? "Technical Support" : msg.sender?.name || "Student"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isStaffMsg
                            ? "bg-neon-purple text-white rounded-tr-none shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                            : "bg-surface-2 border border-border text-foreground rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Suggestions */}
              <div className="px-4 py-2 bg-surface-2/30 border-t border-border flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
                  Quick Canned:
                </span>
                {[
                  "Hi there! We are currently investigating this issue for you.",
                  "Could you please share your registered email or transaction order ID?",
                  "This issue has been resolved. Please refresh your course dashboard.",
                  "Thank you for contacting Cyber Tech Support! Have a great day.",
                ].map((canned, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(canned)}
                    className="px-2.5 py-1 rounded-md bg-background/80 hover:bg-background border border-border/60 text-muted-foreground hover:text-foreground text-[11px] truncate max-w-[200px] shrink-0 transition-colors"
                  >
                    {canned}
                  </button>
                ))}
              </div>

              {/* Message Composer Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface-2/60">
                <div className="flex items-center gap-3">
                  <textarea
                    rows={2}
                    placeholder="Type your response to the student..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="bg-neon-cyan text-black hover:bg-neon-cyan/90 h-11 px-5 font-bold"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Headphones className="h-12 w-12 text-neon-lime/40 mb-3" />
              <h3 className="font-semibold text-foreground text-lg">No Ticket Selected</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Select a ticket from the left panel to begin live messaging with the student.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
