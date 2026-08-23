import { createAPIFileRoute, CORS_HEADERS, corsOptions, verifyBearerToken } from "../_helpers";
import { prisma } from "@/server/db";
import * as crypto from "crypto";

const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export const APIRoute = createAPIFileRoute("/api/payments/verify")({
  OPTIONS: corsOptions,

  /** POST /api/payments/verify */
  POST: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return Response.json(
          { error: "Missing required payment verification parameters" },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { course: true },
      });

      if (!payment) {
        return Response.json(
          { error: "Payment record not found" },
          { status: 404, headers: CORS_HEADERS },
        );
      }

      if (payment.userId !== userId) {
        return Response.json(
          { error: "Unauthorized payment verification" },
          { status: 403, headers: CORS_HEADERS },
        );
      }

      if (payment.status === "PAID") {
        return Response.json(
          { success: true, message: "Payment already verified" },
          { headers: CORS_HEADERS },
        );
      }

      const keyId =
        process.env.RAZORPAY_KEY_ID ||
        process.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_placeholder_key123";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_456";
      const isDev =
        keyId.includes("placeholder") ||
        keySecret.includes("placeholder") ||
        razorpayOrderId.startsWith("order_dev_");

      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const isValidSignature =
        expectedSignature === razorpaySignature ||
        (isDev && razorpaySignature.startsWith("dev_sig_"));

      if (!isValidSignature) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        return Response.json(
          { error: "Invalid payment signature" },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          razorpayPaymentId,
        },
      });

      const expiresAt = new Date(Date.now() + ENROLLMENT_DURATION_MS);
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: payment.courseId },
        },
      });

      if (existing) {
        await prisma.enrollment.update({
          where: { id: existing.id },
          data: { paymentId: payment.id, expiresAt },
        });
      } else {
        await prisma.enrollment.create({
          data: {
            userId,
            courseId: payment.courseId,
            paymentId: payment.id,
            expiresAt,
          },
        });
      }

      try {
        await prisma.notification.create({
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

      return Response.json(
        {
          success: true,
          message: "Payment successfully verified and course unlocked!",
          courseId: payment.courseId,
        },
        { headers: CORS_HEADERS },
      );
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[POST /api/payments/verify]", err);
      return Response.json(
        { error: "Internal server error" },
        { status: 500, headers: CORS_HEADERS },
      );
    }
  },
});
