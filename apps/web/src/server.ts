import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import { APIRoute as loginRoute } from "./routes/api/auth/login";
import { APIRoute as signupRoute } from "./routes/api/auth/signup";
import { APIRoute as meRoute } from "./routes/api/auth/me";
import { APIRoute as profileRoute } from "./routes/api/profile";
import { APIRoute as hunterStatsRoute } from "./routes/api/hunter-stats";
import { APIRoute as coursesIndexRoute } from "./routes/api/courses/index";
import { APIRoute as coursesSlugRoute } from "./routes/api/courses/$slug";
import { APIRoute as enrollmentsIndexRoute } from "./routes/api/enrollments/index";
import { APIRoute as progressUpdateRoute } from "./routes/api/progress/update";

async function handleApi(request: Request) {
  const url = new URL(request.url);
  const p = url.pathname;
  const m = request.method as string;

  const match = async (route: any, params = {}) => {
    if (route && route[m]) return await route[m]({ request, params });
    if (route) return new Response("Method not allowed", { status: 405 });
    return null;
  };

  if (p === "/api/auth/login") return await match(loginRoute);
  if (p === "/api/auth/signup") return await match(signupRoute);
  if (p === "/api/auth/me") return await match(meRoute);
  if (p === "/api/profile") return await match(profileRoute);
  if (p === "/api/hunter-stats") return await match(hunterStatsRoute);
  if (p === "/api/courses") return await match(coursesIndexRoute);
  if (p === "/api/enrollments") return await match(enrollmentsIndexRoute);
  if (p === "/api/progress/update") return await match(progressUpdateRoute);
  
  const coursesSlugMatch = p.match(/^\/api\/courses\/([^/]+)$/);
  if (coursesSlugMatch) return await match(coursesSlugRoute, { slug: coursesSlugMatch[1] });
  
  return null;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        const apiResponse = await handleApi(request);
        if (apiResponse) return apiResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
