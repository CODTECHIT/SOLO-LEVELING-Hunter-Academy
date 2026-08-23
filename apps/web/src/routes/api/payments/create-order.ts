import { createAPIFileRoute, CORS_HEADERS, corsOptions, verifyBearerToken } from "../_helpers";
import { prisma } from "@/server/db";
import * as crypto from "crypto";

const ENROLLMENT_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export const APIRoute = createAPIFileRoute("/api/payments/create-order")({
  OPTIONS: corsOptions,

  /** POST /api/payments/create-order */
  POST: async ({ request }) => {
    try {
      const { userId } = await verifyBearerToken(request);
      const { courseId } = await request.json();

      if (!courseId) {
        return Response.json(
          { error: "courseId is required" },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, description: true, price: true, slug: true },
      });

      if (!course) {
        return Response.json(
          { error: "Course not found" },
          { status: 404, headers: CORS_HEADERS },
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true },
      });

      if (!user) {
        return Response.json(
          { error: "User not found" },
          { status: 404, headers: CORS_HEADERS },
        );
      }

      // Check active enrollment
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      const isExpired = existing?.expiresAt && existing.expiresAt.getTime() <= Date.now();
      if (existing && !isExpired) {
        return Response.json(
          { alreadyEnrolled: true, message: "Already enrolled in this course" },
          { headers: CORS_HEADERS },
        );
      }

      // Free Course
      if (course.price <= 0) {
        const expiresAt = new Date(Date.now() + ENROLLMENT_DURATION_MS);
        if (existing) {
          await prisma.enrollment.update({
            where: { id: existing.id },
            data: { expiresAt },
          });
        } else {
          await prisma.enrollment.create({
            data: { userId, courseId, expiresAt },
          });
        }

        try {
          await prisma.notification.create({
            data: {
              userId,
              title: "🎉 Course Unlocked!",
              message: `You now have access to "${course.title}". Start learning today!`,
              type: "COURSE_PURCHASED",
              data: { courseId: course.id, slug: course.slug },
            },
          });
        } catch {
          // non-blocking
        }

        return Response.json(
          { isFree: true, success: true, message: "Successfully enrolled in free course" },
          { status: 200, headers: CORS_HEADERS },
        );
      }

      const keyId =
        process.env.RAZORPAY_KEY_ID ||
        process.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_placeholder_key123";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key_456";
      const amountInPaise = Math.round(course.price * 100);
      const receipt = `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`;

      let orderId: string;
      const isPlaceholder = keyId.includes("placeholder") || keySecret.includes("placeholder");

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
              notes: { userId, courseId, courseTitle: course.title },
            }),
          });

          if (!res.ok) {
            const errData: any = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.description || "Razorpay API error");
          }

          const rzpOrder: any = await res.json();
          orderId = rzpOrder.id;
        } catch (err: any) {
          orderId = `order_dev_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        }
      } else {
        orderId = `order_dev_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      }

      await prisma.payment.create({
        data: {
          userId,
          courseId,
          amount: course.price,
          currency: "INR",
          status: "PENDING",
          razorpayOrderId: orderId,
        },
      });

      return Response.json(
        {
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
        },
        { status: 200, headers: CORS_HEADERS },
      );
    } catch (err) {
      if (err instanceof Response) return err;
      console.error("[POST /api/payments/create-order]", err);
      return Response.json(
        { error: "Internal server error" },
        { status: 500, headers: CORS_HEADERS },
      );
    }
  },
});
