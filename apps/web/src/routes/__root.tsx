import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { loadAuthTokenFromStorage } from "@/lib/api";

import appCss from "../styles.css?url";
import { DiagonalSplashIntro } from "@/components/site/DiagonalSplashIntro";

if (typeof window !== "undefined") {
  // Polyfill Buffer in browser if not provided by environment
  const dummyBuffer = {
    isBuffer: (obj: any) => obj instanceof Uint8Array,
    from: (data: any, _encoding?: string) => {
      if (typeof data === "string") return new TextEncoder().encode(data);
      if (Array.isArray(data) || data instanceof ArrayBuffer) return new Uint8Array(data);
      return new Uint8Array(0);
    },
    alloc: (size: number) => new Uint8Array(size),
    allocUnsafe: (size: number) => new Uint8Array(size),
    allocUnsafeSlow: (size: number) => new Uint8Array(size),
    concat: (list: Uint8Array[]) => {
      const totalLength = list.reduce((acc, curr) => acc + (curr?.length || 0), 0);
      const res = new Uint8Array(totalLength);
      let offset = 0;
      for (const item of list) {
        if (item) {
          res.set(item, offset);
          offset += item.length;
        }
      }
      return res;
    },
  };
  (window as any).Buffer = Object.assign((window as any).Buffer || {}, dummyBuffer);


  // Unregister stale service workers that may cause CSP/fetch errors
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  }

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cyber Tech Academy — Master Cyber Security & Full Stack Tech" },
      {
        name: "description",
        content:
          "Level up your tech career with Cyber Tech Academy. Industry-led courses, hands-on labs, gamified Hunter ranking system, placement prep, and verifiable certificates.",
      },
      {
        name: "keywords",
        content:
          "cyber security courses, ethical hacking, full stack development, python data science, hunter pass, coding placement prep, cyber tech academy",
      },
      { name: "author", content: "Cyber Tech Academy" },
      { name: "theme-color", content: "#050810" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      // OpenGraph / Facebook
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Cyber Tech Academy" },
      { property: "og:title", content: "Cyber Tech Academy — Master Cyber Security & Full Stack Tech" },
      {
        property: "og:description",
        content:
          "Level up your tech career with Cyber Tech Academy. Industry-led courses, hands-on labs, gamified Hunter ranking system, and verifiable certificates.",
      },
      { property: "og:url", content: "https://www.cybertechacadamy.com/" },
      { property: "og:image", content: "https://www.cybertechacadamy.com/logo.png" },
      { property: "og:locale", content: "en_IN" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cyber Tech Academy — Master Cyber Security & Full Stack Tech" },
      {
        name: "twitter:description",
        content:
          "Level up your tech career with Cyber Tech Academy. Industry-led courses, hands-on labs, gamified Hunter ranking system, and verifiable certificates.",
      },
      { name: "twitter:image", content: "https://www.cybertechacadamy.com/logo.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "https://www.cybertechacadamy.com/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/logo.png", type: "image/png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": "https://www.cybertechacadamy.com/#organization",
              "name": "Cyber Tech Academy",
              "url": "https://www.cybertechacadamy.com/",
              "logo": "https://www.cybertechacadamy.com/logo.png",
              "description": "Gamified tech learning platform offering elite cybersecurity, python, data science, and placement training.",
              "sameAs": [
                "https://www.cybertechacadamy.com"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://www.cybertechacadamy.com/#website",
              "url": "https://www.cybertechacadamy.com/",
              "name": "Cyber Tech Academy",
              "publisher": {
                "@id": "https://www.cybertechacadamy.com/#organization"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.cybertechacadamy.com/courses?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          ]
        })
      }
    ]
  }),


  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-full">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning className="overflow-x-hidden max-w-full min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Load auth token from localStorage on app startup
    loadAuthTokenFromStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DiagonalSplashIntro />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
