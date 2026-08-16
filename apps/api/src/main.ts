import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web and mobile
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://10.0.2.2:3000",
      "http://192.168.0.0/16", // LAN range
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
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

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`🚀 Server is running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
