import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  getInfo() {
    return {
      name: "LMS Portal API",
      version: "1.0.0",
      description: "Backend API for Gamified Hunter Academy LMS",
      endpoints: {
        health: "/health",
        auth: "/auth",
        courses: "/courses",
        admin: "/admin",
        users: "/users",
      },
    };
  }
}
