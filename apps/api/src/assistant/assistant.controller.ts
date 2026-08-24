import {
  Controller,
  Post,
  Body,
  Request,
} from "@nestjs/common";
import { AssistantService } from "./assistant.service";

@Controller("assistant")
export class AssistantController {
  constructor(private assistantService: AssistantService) {}

  @Post("query")
  async queryKnowledge(
    @Request() req: any,
    @Body()
    body: {
      courseId?: string;
      lessonId?: string;
      query: string;
    }
  ) {
    return this.assistantService.searchKnowledge(body);
  }
}
