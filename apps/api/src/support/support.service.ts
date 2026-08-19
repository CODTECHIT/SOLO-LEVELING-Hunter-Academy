import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupportCategory, SupportPriority, SupportStatus } from "@prisma/client";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getStudentTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
  }

  async getTicketDetails(userId: string, userRole: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException("Ticket not found");

    const isStaff = userRole === "ADMIN" || userRole === "TECHNICAL_TEAM" || userRole === "MANAGER" || userRole === "SUB_ADMIN";
    if (ticket.userId !== userId && !isStaff) {
      throw new ForbiddenException("Access denied to this ticket");
    }

    return ticket;
  }

  async createTicket(
    userId: string,
    userRole: any,
    data: { subject: string; category?: SupportCategory; priority?: SupportPriority; message: string }
  ) {
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `TICK-${String(count + 1001).padStart(5, "0")}`;

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: data.subject.trim(),
        category: data.category || "GENERAL",
        priority: data.priority || "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderId: userId,
            senderRole: userRole,
            message: data.message.trim(),
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  async sendMessage(userId: string, userRole: any, ticketId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    });

    if (!ticket) throw new NotFoundException("Ticket not found");

    const isStaff = userRole === "ADMIN" || userRole === "TECHNICAL_TEAM" || userRole === "MANAGER" || userRole === "SUB_ADMIN";
    if (ticket.userId !== userId && !isStaff) {
      throw new ForbiddenException("Unauthorized to reply to this ticket");
    }

    let nextStatus = ticket.status;
    if (isStaff && ticket.status === "OPEN") {
      nextStatus = "IN_PROGRESS";
    } else if (ticket.userId === userId && (ticket.status === "RESOLVED" || ticket.status === "CLOSED")) {
      nextStatus = "IN_PROGRESS";
    }

    const [newMessage] = await this.prisma.$transaction([
      this.prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: userId,
          senderRole: userRole,
          message: message.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    return newMessage;
  }
}
