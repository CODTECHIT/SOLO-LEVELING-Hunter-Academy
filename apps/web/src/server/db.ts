import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_URL environment variable is required in production.",
      );
    }
    console.warn(
      "⚠️ DATABASE_URL is not set. Please configure your .env file.",
    );
  }

  const effectiveUrl =
    connectionString ||
    "postgresql://postgres:postgres@localhost:5432/postgres";
  const isLocal =
    effectiveUrl.includes("localhost") || effectiveUrl.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: effectiveUrl,
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

