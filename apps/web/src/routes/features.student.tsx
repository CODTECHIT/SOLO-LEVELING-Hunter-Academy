import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  CalendarClock,
  CreditCard,
  Gift,
  Heart,
  ListChecks,
  MessagesSquare,
  PlayCircle,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Route as RouteIcon,
  ShieldCheck,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";
import { PageShell } from "@/components/site/nav";
import { Panel } from "@/components/site/ui-bits";
import { studentFeatures } from "@/lib/mock-data";

export const Route = createFileRoute("/features/student")({
  head: () => ({
    meta: [
      { title: "Student Features — Cyber Tech Academy" },
      {
        name: "description",
        content:
          "AI assistant, quizzes, smart player, certificates with QR, pomodoro focus raids, bundles and refunds for hunters.",
      },
      { property: "og:title", content: "Student Features — Cyber Tech Academy" },
      {
        property: "og:description",
        content: "Every learning power-up available to hunters in the academy.",
      },
    ],
  }),
  component: StudentFeatures,
});

const icons = [
  Bot,
  MessagesSquare,
  ListChecks,
  ShieldCheck,
  PlayCircle,
  Heart,
  TrendingUp,
  QrCode,
  Star,
  ReceiptText,
  RefreshCcw,
  Timer,
  RouteIcon,
  CreditCard,
  CalendarClock,
  Gift,
];

function StudentFeatures() {
  return (
    <PageShell
      title="Student Power-Ups"
      subtitle="Sixteen systems that turn ordinary study sessions into ranked dungeon raids."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {studentFeatures.map((f, i) => {
          const Icon = icons[i % icons.length];
          const accent = (["cyan", "purple", "lime"] as const)[i % 3];
          return (
            <Panel key={f.title} accent={accent} hover>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-neon-cyan/40 bg-surface-2 text-neon-cyan">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-base text-foreground">{f.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
