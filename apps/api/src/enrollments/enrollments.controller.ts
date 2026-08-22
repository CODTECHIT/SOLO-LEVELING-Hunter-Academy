import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async enrollByBody(
    @CurrentUser() user: any,
    @Body("courseId") courseId: string,
  ) {
    const userId = user?.id || user?.userId;
    if (!courseId) {
      throw new BadRequestException("Course ID is required");
    }
    return this.enrollmentsService.enrollUser(userId, courseId);
  }

  @Post(":courseId")
  @UseGuards(JwtAuthGuard)
  async enrollInCourse(
    @CurrentUser() user: any,
    @Param("courseId") courseId: string,
  ) {
    const userId = user?.id || user?.userId;
    if (!courseId) {
      throw new BadRequestException("Course ID is required");
    }
    return this.enrollmentsService.enrollUser(userId, courseId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyEnrollments(@CurrentUser() user: any) {
    const userId = user?.id || user?.userId;
    return this.enrollmentsService.getUserEnrollments(userId);
  }

  @Get(":courseId/enrolled")
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @CurrentUser() user: any,
    @Param("courseId") courseId: string,
  ) {
    const userId = user?.id || user?.userId;
    const isEnrolled = await this.enrollmentsService.isUserEnrolled(
      userId,
      courseId,
    );
    return { isEnrolled };
  }
}
