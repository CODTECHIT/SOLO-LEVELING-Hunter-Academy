import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { QuizzesService } from "./quizzes.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("quizzes")
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Get()
  async findAll(@Query("courseId") courseId?: string) {
    return this.quizzesService.findAll(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.id || req.user?.userId;
    return this.quizzesService.findOneForStudent(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/submissions")
  async getSubmissions(@Request() req: any, @Param("id") id: string) {
    return this.quizzesService.getStudentSubmissions(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/submit")
  async submitAttempt(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { answers: { questionId: string; selectedOptionId?: string | null }[] }
  ) {
    return this.quizzesService.submitAttempt(req.user.id, id, body.answers || []);
  }
}
