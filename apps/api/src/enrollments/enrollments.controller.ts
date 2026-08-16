import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post(":courseId")
  @UseGuards(JwtAuthGuard)
  async enrollInCourse(
    @CurrentUser() user: any,
    @Param("courseId") courseId: string,
  ) {
    if (!courseId) {
      throw new BadRequestException("Course ID is required");
    }
    return this.enrollmentsService.enrollUser(user.id, courseId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyEnrollments(@CurrentUser() user: any) {
    return this.enrollmentsService.getUserEnrollments(user.id);
  }

  @Get(":courseId/enrolled")
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @CurrentUser() user: any,
    @Param("courseId") courseId: string,
  ) {
    const isEnrolled = await this.enrollmentsService.isUserEnrolled(
      user.id,
      courseId,
    );
    return { isEnrolled };
  }
}
