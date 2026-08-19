import type { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres.nvezyhkrikioxxxlaytq:qs-F8ZSn4a%3F%25ssU@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient: PrismaClientConstructor } = require("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClientConstructor({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  typeof window === "undefined"
    ? (globalForPrisma.prisma ??= createPrismaClient())
    : (new Proxy({}, {
        get() {
          throw new Error("Prisma cannot be called on the client.");
        },
      }) as unknown as PrismaClient);

