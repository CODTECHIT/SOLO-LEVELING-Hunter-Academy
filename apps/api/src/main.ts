import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enable CORS for web, mobile, and custom domains
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const allowedExact = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8081",
        "http://10.0.2.2:3000",
        "http://10.0.2.2:8081",
        process.env.FRONTEND_URL,
        process.env.MOBILE_FRONTEND_URL,
      ].filter(Boolean) as string[];

      if (allowedExact.includes(origin)) {
        return callback(null, true);
      }

      // Allow local development LAN IPs and any localhost port (e.g. http://localhost:8081, http://192.168.x.x:8081)
      const isLocalLan =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
          origin,
        );
      if (isLocalLan) {
        return callback(null, true);
      }

      // Check against custom comma-separated ALLOWED_ORIGINS env
      const customOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (customOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development mode, allow all origins
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security Headers Middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }
    next();
  });

  // Sliding Window Rate Limiting Middleware for sensitive routes
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

  // Periodically clean up expired rate limit entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  app.use((req: any, res: any, next: () => void) => {
    const isAuthRoute = req.path?.startsWith("/auth/");
    const isPaymentRoute = req.path?.startsWith("/payments/");

    if (!isAuthRoute && !isPaymentRoute) {
      return next();
    }

    const clientIp =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const bucketKey = `${clientIp}:${isAuthRoute ? "auth" : "payment"}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxLimit = isAuthRoute ? 20 : 30; // 20 attempts/min for auth, 30 for payments

    let record = rateLimitStore.get(bucketKey);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(bucketKey, record);
    } else {
      record.count++;
    }

    res.setHeader("X-RateLimit-Limit", maxLimit);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxLimit - record.count),
    );

    if (record.count > maxLimit) {
      return res.status(429).json({
        statusCode: 429,
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please wait a moment before trying again.",
      });
    }

    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
