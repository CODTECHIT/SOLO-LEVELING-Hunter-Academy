import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/lms";
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || "30", 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter,
      errorFormat: "pretty",
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log("✅ Prisma connected to database");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
