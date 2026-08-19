import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres.nvezyhkrikioxxxlaytq:qs-F8ZSn4a%3F%25ssU@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (typeof window !== "undefined") {
    return new Proxy({}, {
      get() {
        throw new Error("Prisma cannot be called on the client.");
      },
    }) as unknown as PrismaClient;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    if (typeof window !== "undefined") {
      throw new Error("Prisma cannot be called on the client.");
    }
    let client = getPrismaClient();
    if (typeof prop === "string" && (client as any)[prop] === undefined) {
      // If a newly generated model is accessed that was missing from stale cache, re-create
      globalForPrisma.prisma = createPrismaClient();
      client = globalForPrisma.prisma;
    }
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

