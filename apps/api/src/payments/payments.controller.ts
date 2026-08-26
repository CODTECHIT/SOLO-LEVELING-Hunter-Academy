import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("create-order")
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser() user: any,
    @Body("courseId") courseId: string,
  ) {
    const userId = user?.id || user?.userId;
    if (!courseId) {
      throw new BadRequestException("courseId is required");
    }
    return this.paymentsService.createOrder(userId, courseId);
  }

  @Post("verify")
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @CurrentUser() user: any,
    @Body()
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      courseId: string;
    },
  ) {
    const userId = user?.id || user?.userId;
    return this.paymentsService.verifyPayment(userId, body);
  }

  @Post("webhook")
  async webhook(
    @Body() payload: any,
    @Headers("x-razorpay-signature") signature: string,
    @Req() req: any,
  ) {
    const rawBody = req?.rawBody;
    return this.paymentsService.handleWebhook(payload, signature, rawBody);
  }
}
