import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "@nestjs/passport";

@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req: any) {
    return this.notificationsService.getUserNotifications(req.user.id || req.user.sub);
  }

  @Post(":id/read")
  async markAsRead(@Request() req: any, @Param("id") id: string) {
    return this.notificationsService.markAsRead(req.user.id || req.user.sub, id);
  }

  @Post("read-all")
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id || req.user.sub);
  }
}
