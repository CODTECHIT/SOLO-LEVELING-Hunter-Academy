import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as bcryptjs from "bcryptjs";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";

@Injectable()
export class AuthService {
  private resetCodes = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }

    const hashedPassword = await bcryptjs.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        role: "STUDENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: "User created successfully",
      token,
      user,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcryptjs.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: "Sign in successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async syncOAuthUser(data: { email: string; name?: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const randomPassword = await bcryptjs.hash(
        Math.random().toString(36).slice(-10),
        10,
      );
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: data.name || "Hunter",
          password: randomPassword,
          role: "STUDENT",
        },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: "OAuth sign in successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      },
    });
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't leak user existence for security
      return {
        success: true,
        message: "If your email is registered, a password reset code has been sent.",
      };
    }

    // Generate random 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    this.resetCodes.set(normalizedEmail, { code, expiresAt });

    await this.mailService.sendPasswordResetEmail(normalizedEmail, code);

    return {
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    };
  }

  async resetPassword(dto: { email: string; code: string; newPassword: string }) {
    const { email, code, newPassword } = dto;
    if (!email || !code || !newPassword) {
      throw new BadRequestException("Email, reset code, and new password are required");
    }

    if (newPassword.length < 6) {
      throw new BadRequestException("Password must be at least 6 characters long");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = this.resetCodes.get(normalizedEmail);

    if (!record) {
      throw new BadRequestException("Invalid or expired reset code. Please request a new one.");
    }

    if (record.expiresAt < Date.now()) {
      this.resetCodes.delete(normalizedEmail);
      throw new BadRequestException("Reset code has expired. Please request a new one.");
    }

    if (record.code !== code.trim()) {
      throw new BadRequestException("Incorrect verification code. Please check your email.");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword },
    });

    // Invalidate the code
    this.resetCodes.delete(normalizedEmail);

    return {
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    };
  }
}
