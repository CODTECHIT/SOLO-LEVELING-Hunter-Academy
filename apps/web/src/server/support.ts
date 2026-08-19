import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { getCurrentUserFn } from "./auth";
import { ensurePermission } from "./permissions";

import { SupportCategory, SupportPriority, SupportStatus } from "@prisma/client";

// Get support tickets for Admin / Technical Support Desk
export const getAdminSupportTicketsFn = createServerFn({ method: "GET" })
  .validator((d?: { status?: string; category?: string; priority?: string; search?: string }) => d)
  .handler(async ({ data }) => {
    await ensurePermission("support");

    const where: any = {};
    if (data?.status && data.status !== "ALL") {
      where.status = data.status as SupportStatus;
    }
    if (data?.category && data.category !== "ALL") {
      where.category = data.category as SupportCategory;
    }
    if (data?.priority && data.priority !== "ALL") {
      where.priority = data.priority as SupportPriority;
    }
    if (data?.search && data.search.trim()) {
      where.OR = [
        { subject: { contains: data.search.trim(), mode: "insensitive" } },
        { ticketNumber: { contains: data.search.trim(), mode: "insensitive" } },
        { user: { name: { contains: data.search.trim(), mode: "insensitive" } } },
        { user: { email: { contains: data.search.trim(), mode: "insensitive" } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    const openCount = await prisma.supportTicket.count({ where: { status: "OPEN" } });
    const inProgressCount = await prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } });
    const resolvedCount = await prisma.supportTicket.count({ where: { status: "RESOLVED" } });

    return { tickets, counts: { open: openCount, inProgress: inProgressCount, resolved: resolvedCount } };
  });

// Get tickets for logged in Student
export const getStudentSupportTicketsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUserFn();
  if (!user) throw new Error("Please log in to access support");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  return { tickets };
});

// Get detailed ticket with live conversation stream
export const getTicketDetailsFn = createServerFn({ method: "GET" })
  .validator((d: { ticketId: string }) => d)
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to view ticket");

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) throw new Error("Ticket not found");

    // Access control: only ticket owner or authorized staff can read
    const isOwner = ticket.userId === user.id;
    const isStaff = user.role === "ADMIN" || user.role === "TECHNICAL_TEAM" || user.role === "MANAGER" || Boolean(user.customRoleId);

    if (!isOwner && !isStaff) {
      throw new Error("Access denied to this ticket");
    }

    return ticket;
  });

// Create new support ticket
export const createSupportTicketFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      subject: string;
      category: SupportCategory;
      priority?: SupportPriority;
      message: string;
    }) => d
  )
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to create a ticket");

    const count = await prisma.supportTicket.count();
    const ticketNumber = `TICK-${String(count + 1001).padStart(5, "0")}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject: data.subject.trim(),
        category: data.category || "GENERAL",
        priority: data.priority || "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderId: user.id,
            senderRole: user.role,
            message: data.message.trim(),
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return ticket;
  });

// Send message to ticket (Live messaging)
export const sendSupportMessageFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      ticketId: string;
      message: string;
      attachments?: string;
    }) => d
  )
  .handler(async ({ data }) => {
    const user = await getCurrentUserFn();
    if (!user) throw new Error("Please log in to send message");

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      select: { id: true, userId: true, status: true },
    });

    if (!ticket) throw new Error("Ticket not found");

    const isOwner = ticket.userId === user.id;
    const isStaff = user.role === "ADMIN" || user.role === "TECHNICAL_TEAM" || user.role === "MANAGER" || Boolean(user.customRoleId);

    if (!isOwner && !isStaff) {
      throw new Error("Unauthorized to reply to this ticket");
    }

    // Auto-update ticket status: if staff replies, keep in progress; if student replies on resolved/closed ticket, reopen as in progress
    let nextStatus = ticket.status;
    if (isStaff && ticket.status === "OPEN") {
      nextStatus = "IN_PROGRESS";
    } else if (isOwner && (ticket.status === "RESOLVED" || ticket.status === "CLOSED")) {
      nextStatus = "IN_PROGRESS";
    }

    const [newMessage] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          ticketId: data.ticketId,
          senderId: user.id,
          senderRole: user.role,
          message: data.message.trim(),
          attachments: data.attachments || null,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.supportTicket.update({
        where: { id: data.ticketId },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    return newMessage;
  });

// Update ticket status or assignment (Technical team / Admin)
export const updateTicketStatusFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      ticketId: string;
      status?: SupportStatus;
      priority?: SupportPriority;
      assignedToId?: string | null;
    }) => d
  )
  .handler(async ({ data }) => {
    await ensurePermission("support");

    const updated = await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        updatedAt: new Date(),
      },
    });

    return updated;
  });
