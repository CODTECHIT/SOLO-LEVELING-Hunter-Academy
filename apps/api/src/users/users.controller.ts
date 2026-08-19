import { Controller, Get, Post, Body, UseGuards, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("enrollments")
  async getEnrollments(@Request() req) {
    return this.usersService.getUserEnrollments(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("progress")
  async getProgress(@Request() req) {
    return this.usersService.getUserLearningProgress(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("progress")
  async updateProgress(
    @Request() req,
    @Body()
    body: {
      lessonId: string;
      watchedSeconds: number;
      duration?: number;
      completed?: boolean;
    },
  ) {
    return this.usersService.updateProgress(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("stats")
  async getHunterStats(@Request() req) {
    return this.usersService.getHunterStats(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("purchases")
  async getPurchases(@Request() req) {
    return this.usersService.getUserPurchases(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("refunds")
  async getRefunds(@Request() req) {
    return this.usersService.getUserRefunds(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("refunds")
  async requestRefund(@Request() req, @Body() body: { paymentId: string; reason: string }) {
    return this.usersService.requestRefund(req.user.userId, body);
  }
}
