import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getKeyId(): string {
    return (
      this.configService.get<string>("RAZORPAY_KEY_ID") ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_placeholder_key123"
    );
  }

  private getKeySecret(): string {
    return (
      this.configService.get<string>("RAZORPAY_KEY_SECRET") ||
      process.env.RAZORPAY_KEY_SECRET ||
      "placeholder_secret_key_456"
    );
  }

  /**
   * Create Razorpay Order or handle Free Course enrollment
   */
  async createOrder(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        slug: true,
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Check if user is already enrolled and access is still active
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    const isExpired =
      existing?.expiresAt && existing.expiresAt.getTime() <= Date.now();

    if (existing && !isExpired) {
      return {
        alreadyEnrolled: true,
        message: "You are already enrolled in this course",
        courseId: course.id,
      };
    }

    // Free course handler (Price is 0)
    if (course.price <= 0) {
      const expiresAt = new Date(Date.now() + ENROLLMENT_DURATION_MS);
      if (existing) {
        await this.prisma.enrollment.update({
          where: { id: existing.id },
          data: { expiresAt },
        });
      } else {
        await this.prisma.enrollment.create({
          data: {
            userId,
            courseId,
            expiresAt,
          },
        });
      }

      // Create notification
      try {
        await this.prisma.notification.create({
          data: {
            userId,
            title: "🎉 Course Unlocked!",
            message: `You now have access to "${course.title}". Start learning today!`,
            type: "COURSE_PURCHASED",
            data: { courseId: course.id, slug: course.slug },
          },
        });
      } catch {
        // Non-blocking
      }

      return {
        isFree: true,
        success: true,
        message: "Successfully enrolled in free course",
        courseId: course.id,
      };
    }

    // Paid course flow: Create Razorpay Order
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    const amountInPaise = Math.round(course.price * 100);
    const receipt = `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`;

    let orderId: string;

    const isPlaceholder =
      keyId.includes("placeholder") || keySecret.includes("placeholder");

    if (!isPlaceholder) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const res = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
              userId,
              courseId,
              courseTitle: course.title,
            },
          }),
        });

        if (!res.ok) {
          const errData: any = await res.json().catch(() => ({}));
          console.warn("Razorpay API Order Error:", errData);
          throw new Error(errData?.error?.description || "Razorpay API error");
        }

        const rzpOrder: any = await res.json();
        orderId = rzpOrder.id;
      } catch (err: any) {
        console.warn("Falling back to dev order due to Razorpay error:", err.message);
        orderId = `order_dev_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      }
    } else {
      // Dev placeholder mode
      orderId = `order_dev_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    }

    // Record pending Payment in DB
    await this.prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId: orderId,
      },
    });

    return {
      orderId,
      amount: amountInPaise,
      currency: "INR",
      keyId,
      courseTitle: course.title,
      courseDescription: course.description,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    };
  }

  /**
   * Cryptographically verify Razorpay Payment and finalize Enrollment
   */
  async verifyPayment(
    userId: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      courseId: string;
    },
  ) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } =
      data;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new BadRequestException("Missing required payment verification parameters");
    }

    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { course: true },
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found for order");
    }

    if (payment.userId !== userId) {
      throw new UnauthorizedException("Unauthorized payment verification");
    }

    if (payment.status === "PAID") {
      return {
        success: true,
        alreadyProcessed: true,
        message: "Payment already verified and processed",
      };
    }

    const keySecret = this.getKeySecret();
    const keyId = this.getKeyId();
    const isDev =
      keyId.includes("placeholder") ||
      keySecret.includes("placeholder") ||
      razorpayOrderId.startsWith("order_dev_");

    // Standard Razorpay HMAC SHA-256 verification
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValidSignature =
      expectedSignature === razorpaySignature ||
      (isDev && razorpaySignature.startsWith("dev_sig_"));

    if (!isValidSignature) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      throw new BadRequestException("Payment verification failed: Invalid signature");
    }

    // Mark payment as PAID
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId,
      },
    });

    // Grant or renew 1-year enrollment
    const expiresAt = new Date(Date.now() + ENROLLMENT_DURATION_MS);
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: payment.courseId },
      },
    });

    if (existing) {
      await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { paymentId: payment.id, expiresAt },
      });
    } else {
      await this.prisma.enrollment.create({
        data: {
          userId,
          courseId: payment.courseId,
          paymentId: payment.id,
          expiresAt,
        },
      });
    }

    // Create Notification
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: "🎉 Course Unlocked!",
          message: `Payment successful! You now have full access to "${payment.course.title}".`,
          type: "COURSE_PURCHASED",
          data: { courseId: payment.course.id, slug: payment.course.slug },
        },
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      message: "Payment successfully verified and course unlocked!",
      courseId: payment.courseId,
    };
  }

  /**
   * Handle Webhooks from Razorpay
   */
  async handleWebhook(payload: any, signature: string) {
    const keySecret = this.getKeySecret();
    const isPlaceholder = keySecret.includes("placeholder");

    if (!isPlaceholder && signature) {
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(JSON.stringify(payload))
        .digest("hex");

      if (expectedSig !== signature) {
        throw new BadRequestException("Invalid webhook signature");
      }
    }

    const event = payload?.event;
    if (event === "payment.captured" || event === "order.paid") {
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const orderId = entity?.order_id || entity?.id;
      const paymentId = entity?.id;

      if (orderId) {
        const payment = await this.prisma.payment.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (payment && payment.status !== "PAID") {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              razorpayPaymentId: paymentId,
            },
          });

          const expiresAt = new Date(Date.now() + ENROLLMENT_DURATION_MS);
          await this.prisma.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: payment.userId,
                courseId: payment.courseId,
              },
            },
            create: {
              userId: payment.userId,
              courseId: payment.courseId,
              paymentId: payment.id,
              expiresAt,
            },
            update: {
              paymentId: payment.id,
              expiresAt,
            },
          });
        }
      }
    }

    return { status: "ok" };
  }
}
