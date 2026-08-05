import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCatalogFn } from "@/server/courses";
import { Layers, PlayCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  loader: async () => {
    return await getCatalogFn();
  },
  head: () => ({
    meta: [
      { title: "Hunter Pass — Topic Modules — Cyber Tech Academy" },
      { name: "description", content: "Short, topic-wise module courses from ₹399." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { moduleCourses } = Route.useLoaderData();

  return (
    <PageShell
      title="Hunter Pass: Topic Modules"
      subtitle="Short, focused module courses — learn one topic, unlock one skill. Each module from ₹399."
    >
      {/* Cross-link to the full-course tier */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neon-purple/25 bg-neon-purple/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-neon-purple shrink-0" />
          <p className="text-sm text-muted-foreground">
            Prefer the complete journey? <span className="text-neon-purple font-medium">Full courses</span> cover an entire discipline end-to-end.
          </p>
        </div>
        <Link to="/courses">
          <Button variant="neonPurple" size="sm" className="shrink-0">
            Browse Full Courses
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {moduleCourses.map((course) => (
          <div
            key={course.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-neon-amber/25 bg-background/50 hover-glow transition-all"
          >
            <div className="aspect-video bg-surface-2 relative overflow-hidden">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neon-amber/20">
                  <PlayCircle className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center rounded-md bg-neon-amber/20 px-2 py-1 text-[10px] font-display font-bold uppercase tracking-widest text-neon-amber ring-1 ring-inset ring-neon-amber/40">
                Module
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6 relative z-10 -mt-10">
              <span className="inline-flex items-center rounded-md bg-neon-amber/10 px-2 py-1 text-xs font-medium text-neon-amber ring-1 ring-inset ring-neon-amber/20 mb-4 w-fit">
                {course.category.name}
              </span>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{course.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <div className="font-display font-bold text-neon-amber">
                    ₹{course.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    one-time
                  </div>
                </div>
                <Link to="/courses/$slug" params={{ slug: course.slug }}>
                  <Button variant="neon" size="sm">
                    <Layers className="mr-2 h-3.5 w-3.5" /> Unlock Module
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {moduleCourses.length === 0 && (
          <Panel className="col-span-full text-center py-16 text-muted-foreground">
            No module courses available yet. Check back soon — new topics are being forged.
          </Panel>
        )}
      </div>
    </PageShell>
  );
}
