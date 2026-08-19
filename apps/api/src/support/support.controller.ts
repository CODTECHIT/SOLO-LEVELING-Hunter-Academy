import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { SupportService } from "./support.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SupportCategory, SupportPriority } from "@prisma/client";

@UseGuards(JwtAuthGuard)
@Controller("support")
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get("my-tickets")
  async getMyTickets(@Request() req: any) {
    return this.supportService.getStudentTickets(req.user.id);
  }

  @Get("tickets/:id")
  async getTicketDetails(@Request() req: any, @Param("id") id: string) {
    return this.supportService.getTicketDetails(req.user.id, req.user.role, id);
  }

  @Post("tickets")
  async createTicket(
    @Request() req: any,
    @Body()
    body: {
      subject: string;
      category?: SupportCategory;
      priority?: SupportPriority;
      message: string;
    }
  ) {
    return this.supportService.createTicket(req.user.id, req.user.role, body);
  }

  @Post("tickets/:id/messages")
  async sendMessage(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { message: string }
  ) {
    return this.supportService.sendMessage(req.user.id, req.user.role, id, body.message);
  }
}
