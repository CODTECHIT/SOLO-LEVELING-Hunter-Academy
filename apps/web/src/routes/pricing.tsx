import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Boxes, Search, X } from "lucide-react";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { HunterHero } from "@/components/site/catalog-hero";
import { CourseCard, type CourseTone } from "@/components/site/course-card";
import { Panel } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCatalogFn, getEnrolledCoursesFn } from "@/server/courses";
import { getCurrentUserFn } from "@/server/auth";
import { HeroCtas } from "@/components/site/hero-ctas";

export const Route = createFileRoute("/pricing")({
  loader: async () => {
    const data = await getCatalogFn();
    const user = await getCurrentUserFn();
    const enrolledCourses = user ? await getEnrolledCoursesFn() : [];
    return { ...data, user, enrolledCourses };
  },
  head: () => ({
    meta: [
      { title: "Hunter Pass — Topic Modules — Cyber Tech Academy" },
      { name: "description", content: "Short, topic-wise module courses from ₹399." },
    ],
  }),
  component: PricingPage,
});

const tones: CourseTone[] = ["amber", "cyan", "purple"];

const moduleBenefits = [
  "1 year of access — renew anytime and keep your progress",
  "Self-paced — hunt on your own schedule",
  "Focused — master one topic fast",
];

function PricingPage() {
  const { categories, moduleCourses, user, enrolledCourses } = Route.useLoaderData();

  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c) => c.id)), [enrolledCourses]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const query = search.trim().toLowerCase();
  const filtered = moduleCourses.filter((c) => {
    if (categoryFilter !== "ALL" && c.category?.id !== categoryFilter) return false;
    if (query && ![c.title, c.description].some((v) => v.toLowerCase().includes(query)))
      return false;
    return true;
  });

  const isFiltering = query.length > 0 || categoryFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
  };

  const categoryOptions = categories.map((c) => ({
    ...c,
    courseCount: c.courses.filter((course) => course.type === "MODULE").length,
  }));

  // If the selected category contains no module courses, those are full
  // courses — hint the visitor that the content lives in the Courses page.
  const selectedCategory =
    categoryFilter !== "ALL" ? categories.find((c) => c.id === categoryFilter) : undefined;
  const selectionHasModules = selectedCategory?.courses.some((course) => course.type === "MODULE");

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <HunterHero
          eyebrow="Hunter Pass · Quick Skill Unlocks"
          title={
            <>
              One Topic. <span className="text-neon">One New Power.</span>
            </>
          }
          subtitle="Short, focused module courses for hunters who need a specific skill — fast. Unlock one topic, add one weapon to your arsenal. Each module from ₹399, yours for life."
          cta={
            <HeroCtas
              user={user}
              loggedOut={{
                primary: { label: "Awaken with a Full Path", to: "/courses" },
                secondary: { label: "Join the Guild", to: "/signup" },
              }}
              student={{
                primary: { label: "Explore Full Courses", to: "/courses" },
                secondary: { label: "Go to My Dashboard", to: "/dashboard" },
              }}
              admin={{
                primary: { label: "Explore Full Courses", to: "/courses" },
                secondary: { label: "Open Guild Control", to: "/admin/academy" },
              }}
            />
          }
        />

        {/* Cross-link to the full-course tier */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-neon-purple/25 bg-neon-purple/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-neon-purple" />
            <p className="text-sm text-muted-foreground">
              Prefer the complete journey?{" "}
              <span className="font-medium text-neon-purple">Full courses</span> cover an entire
              discipline end-to-end.
            </p>
          </div>
          <Link to="/courses" className="shrink-0">
            <Button variant="neonPurple" size="sm" className="h-10 w-full sm:w-auto">
              Browse Full Courses
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-neon-amber glow-text sm:text-base">
              Choose Your Module
            </h2>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-display text-muted-foreground">
              {filtered.length} of {moduleCourses.length} module
              {moduleCourses.length === 1 ? "" : "s"} available
            </span>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules by name or description..."
                className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-neon-amber focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-amber focus:outline-none sm:w-56"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {isFiltering && (
              <button
                onClick={resetFilters}
                className="self-start rounded-md px-3 py-2 text-xs font-display uppercase tracking-wider text-neon-amber transition-colors hover:bg-neon-amber/10 sm:self-auto"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                tone={tones[i % tones.length]}
                ctaLabel="Unlock This Module"
                benefits={moduleBenefits}
                enrolled={enrolledIds.has(course.id)}
              />
            ))}
            {filtered.length === 0 && (
              <Panel className="col-span-full flex flex-col items-center gap-3 border-dashed py-16 text-center">
                <Boxes className="h-10 w-10 text-muted-foreground/40" />
                <p className="font-display text-base font-bold text-foreground">
                  {isFiltering ? "No modules match your search" : "No modules available yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isFiltering
                    ? "Try a different keyword or category, or reset the filters."
                    : "New topics are being forged. Check back soon, hunter."}
                </p>
                {isFiltering && categoryFilter !== "ALL" && !selectionHasModules && (
                  <p className="mt-2 text-sm text-neon-amber">
                    This content may be in Courses — complete end-to-end pathways.
                    <Link
                      to="/courses"
                      className="ml-1 font-display uppercase tracking-wider text-neon-amber underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Browse Courses
                    </Link>
                  </p>
                )}
                {isFiltering && (
                  <button
                    onClick={resetFilters}
                    className="mt-1 text-xs font-display uppercase tracking-wider text-neon-amber hover:underline"
                  >
                    Reset filters
                  </button>
                )}
              </Panel>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
