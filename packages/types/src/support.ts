import { UserRole } from "./auth";

export type SupportCategory = "GENERAL" | "TECHNICAL" | "BILLING" | "COURSE_CONTENT" | "ACCOUNT";
export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportMessageDTO {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderRole: UserRole;
  message: string;
  attachments?: string | null;
  createdAt: string;
}

export interface SupportTicketDTO {
  id: string;
  ticketNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  messages?: SupportMessageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  category: SupportCategory;
  priority?: SupportPriority;
  initialMessage: string;
}

export interface SendMessageRequest {
  ticketId: string;
  message: string;
  attachments?: string;
}

export interface UpdateTicketStatusRequest {
  ticketId: string;
  status?: SupportStatus;
  priority?: SupportPriority;
  assignedToId?: string | null;
}
