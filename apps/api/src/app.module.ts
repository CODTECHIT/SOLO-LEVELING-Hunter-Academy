import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { AdminModule } from "./admin/admin.module";
import { UsersModule } from "./users/users.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
      signOptions: { expiresIn: "7d" },
    }),
    PassportModule,
    PrismaModule,
    AuthModule,
    CoursesModule,
    AdminModule,
    UsersModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
