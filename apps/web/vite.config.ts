import { defineConfig, type Plugin } from "vite";
import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

function serverOnlyModulesPlugin(): Plugin {
  const serverOnlyPkgs = new Set(["pg", "@prisma/adapter-pg", "@prisma/client"]);
  return {
    name: "server-only-modules-stub",
    enforce: "pre",
    resolveId(id, importer, options) {
      if (!options?.ssr) {
        if (serverOnlyPkgs.has(id)) {
          return `\0virtual:${id}-client-stub`;
        }
        if (
          id === "@/server/db" ||
          id === "./db" ||
          id.endsWith("/server/db.ts") ||
          id.endsWith("/server/db")
        ) {
          if (importer && (importer.includes("server") || importer.includes("routes"))) {
            return "\0virtual:server-db-client-stub";
          }
        }
      }
      return null;
    },
    load(id) {
      if (id === "\0virtual:server-db-client-stub") {
        return `
          export const prisma = new Proxy({}, {
            get(_, prop) {
              return () => {
                throw new Error(\`Prisma cannot be called on client (\${String(prop)})\`);
              };
            }
          });
          export default { prisma };
        `;
      }
      if (id.startsWith("\0virtual:") && id.endsWith("-client-stub")) {
        return `
          export class Pool {}
          export class PrismaPg {}
          export class PrismaClient {}
          export const Prisma = {};
          export const types = {};
          export default {};
        `;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    serverOnlyModulesPlugin(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    nitro(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  ssr: {
    external: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs", "jose"],
  },
});
