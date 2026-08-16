import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard(@Request() req) {
    return this.adminService.getDashboardStats(req.user.userId);
  }

  @Get("refunds")
  async getRefunds(@Request() req) {
    return this.adminService.listRefundRequests(req.user.userId);
  }
}
