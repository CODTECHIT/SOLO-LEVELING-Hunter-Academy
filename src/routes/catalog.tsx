import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { PageShell } from "@/components/site/nav";
import { Panel, PanelTitle, XPBar } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { catalogCategories, modules } from "@/lib/mock-data";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Course Catalog — Solo Leveling Academy" },
      {
        name: "description",
        content:
          "Browse ranked course pathways, unlock individual modules or buy the full Cyber Security pathway bundle in ₹ INR.",
      },
      { property: "og:title", content: "Course Catalog — Solo Leveling Academy" },
      {
        property: "og:description",
        content: "Ranked modules, bundle pricing and full-pathway unlocks for hunters.",
      },
    ],
  }),
  component: Catalog,
});

const modulesTotal = modules.reduce((s, m) => s + m.price, 0);
const bundlePrice = 3999;

function Catalog() {
  return (
    <PageShell
      title="Course Catalog: Advanced Studies"
      subtitle="Filter by rank, dungeon type or system utility. Unlock modules individually or claim the full pathway at a discount."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <Panel accent="cyan" className="h-max">
          <PanelTitle>Category</PanelTitle>
          <ul className="space-y-2">
            {catalogCategories.map((c, i) => (
              <li key={c}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-foreground">
                  <input
                    type="checkbox"
                    defaultChecked={i === catalogCategories.length - 1}
                    className="accent-[var(--neon-cyan)]"
                  />
                  {c}
                </label>
              </li>
            ))}
          </ul>
          <PanelTitle className="mt-6">Rank Filter</PanelTitle>
          <div className="flex flex-wrap gap-2">
            {["S", "A", "B", "C", "D", "E"].map((r) => (
              <button
                key={r}
                className="hover-glow rounded-lg border border-border px-3 py-1 font-display text-xs text-muted-foreground"
              >
                {r}
              </button>
            ))}
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          {/* Featured hero */}
          <Panel className="relative overflow-hidden">
            <div className="grid-runes absolute inset-0 opacity-30" aria-hidden />
            <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-neon-lime/50 bg-neon-lime/10 px-3 py-1 font-display text-[10px] uppercase tracking-widest text-neon-lime">
                  <ShieldCheck className="size-3" /> A-Rank Pathway
                </span>
                <h2 className="mt-3 font-display text-xl font-bold text-foreground sm:text-2xl">
                  Cyber Security: Defending the System
                </h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  Total duration 80 hours · 4 module units · Completion reward: Hunter Certification
                  with QR verification.
                </p>
                <div className="mt-4 max-w-sm">
                  <XPBar value={0} label="Your progress" accent="cyan" />
                </div>
              </div>
              <div className="panel-lime flex flex-col justify-between gap-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-widest text-neon-lime">
                    Full Course
                  </span>
                  <Lock className="size-4 text-neon-amber" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground line-through">
                    ₹{modulesTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="font-display text-3xl font-bold text-neon-lime glow-text">
                    ₹{bundlePrice.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-neon-cyan">
                    Save ₹{(modulesTotal - bundlePrice).toLocaleString("en-IN")} vs individual
                    modules
                  </p>
                </div>
                <Link to="/pricing">
                  <Button variant="hero" className="w-full">
                    <Sparkles /> Purchase
                  </Button>
                </Link>
              </div>
            </div>
          </Panel>

          {/* Modules */}
          <Panel accent="cyan">
            <PanelTitle right={<Lock className="size-3.5 text-muted-foreground" />}>
              System_Breakdown: Module Units
            </PanelTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map((m) => (
                <div
                  key={m.code}
                  className="hover-glow flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-4"
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon-purple/50 bg-surface-2 font-display text-xs font-bold text-neon-purple">
                      {m.code}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm text-foreground">{m.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-neon-cyan">
                      ₹{m.price.toLocaleString("en-IN")}
                    </span>
                    <Button variant="neon" size="sm">
                      Unlock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Bundle comparison */}
          <Panel accent="lime">
            <PanelTitle>Bundle Comparison</PanelTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  Individual Modules
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">
                  ₹{modulesTotal.toLocaleString("en-IN")}
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>Pay per module as you unlock</li>
                  <li>90 days access per module</li>
                  <li>No certification bundle</li>
                </ul>
              </div>
              <div className="rounded-xl border border-neon-lime/50 bg-neon-lime/5 p-4">
                <p className="font-display text-xs uppercase tracking-widest text-neon-lime">
                  Complete Pathway
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-neon-lime">
                  ₹{bundlePrice.toLocaleString("en-IN")}
                </p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>All 4 modules unlocked instantly</li>
                  <li>12 months access + live raids</li>
                  <li>Hunter Certification included</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
