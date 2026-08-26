import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret =
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV === "production"
        ? undefined
        : "dev-fallback-secret-local-only");

    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || "dev-fallback-secret-local-only",
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
