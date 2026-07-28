import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Bot, IdCard, Layers, MessagesSquare, Wallet } from "lucide-react";
import { PageShell } from "@/components/site/nav";
import { Panel } from "@/components/site/ui-bits";
import { instructorFeatures } from "@/lib/mock-data";

export const Route = createFileRoute("/features/instructor")({
  head: () => ({
    meta: [
      { title: "Instructor Features — Solo Leveling Academy" },
      {
        name: "description",
        content:
          "AI course creation, course builder, earnings tracking, Q&A management and instructor profiles for academy mentors.",
      },
      { property: "og:title", content: "Instructor Features — Solo Leveling Academy" },
      {
        property: "og:description",
        content: "Everything mentors need to build, teach and earn on the academy.",
      },
    ],
  }),
  component: InstructorFeatures,
});

const icons = [Bot, BarChart3, Layers, Wallet, MessagesSquare, IdCard];

function InstructorFeatures() {
  return (
    <PageShell
      title="Instructor Toolkit"
      subtitle="Guild masters get an AI-assisted course pipeline, live earnings and hunter Q&A in one system."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {instructorFeatures.map((f, i) => {
          const Icon = icons[i % icons.length];
          const accent = (["purple", "cyan", "lime"] as const)[i % 3];
          return (
            <Panel key={f.title} accent={accent} hover>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-neon-purple/40 bg-surface-2 text-neon-purple">
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
