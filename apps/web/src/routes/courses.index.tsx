import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Layers, SlidersHorizontal, Boxes, Check, BookOpen } from "lucide-react";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { HunterHero } from "@/components/site/catalog-hero";
import { CourseCard } from "@/components/site/course-card";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCatalogFn, getEnrolledCoursesFn } from "@/server/courses";
import { getCurrentUserFn } from "@/server/auth";
import { HeroCtas } from "@/components/site/hero-ctas";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/")({
  loader: async () => {
    const data = await getCatalogFn();
    const user = await getCurrentUserFn();
    const enrolledCourses = user ? await getEnrolledCoursesFn() : [];
    return { ...data, user, enrolledCourses };
  },
  head: () => ({
    meta: [
      { title: "Course Catalog — Cyber Tech Academy" },
      { name: "description", content: "Browse ranked course pathways." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { categories, fullCourses, user, enrolledCourses } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c) => c.id)), [enrolledCourses]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const filteredCourses = useMemo(() => {
    return fullCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(course.categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [fullCourses, searchQuery, selectedCategories]);

  // All categories appear in the filter; counts reflect full courses only,
  // and only FULL-type courses are shown on this page (modules live on /pricing).
  const fullCourseCategories = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        courseCount: c.courses.filter((course) => course.type === "FULL").length,
      })),
    [categories],
  );

  // If the selected categories contain no full courses, those are module
  // courses — hint the visitor that the content lives in Hunter Pass.
  const selectionHasFullCourses = selectedCategories.some((id) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.courses.some((course) => course.type === "FULL");
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <HunterHero
          eyebrow="System Notification · Guild Rank Unlocked"
          title={
            <>
              Awaken Your Path. <span className="text-neon">Level Up Your Skills.</span>
            </>
          }
          subtitle="Complete, paid pathways forged for serious hunters. Master an entire discipline end-to-end — from your first quest to the final boss."
          cta={
            <HeroCtas
              user={user}
              loggedOut={{
                primary: { label: "Start Your Awakening", to: "/signup" },
                secondary: { label: "Explore Hunter Pass", to: "/pricing" },
              }}
              student={{
                primary: { label: "Go to My Courses", to: "/dashboard" },
                secondary: { label: "Browse Hunter Pass", to: "/pricing" },
              }}
              admin={{
                primary: { label: "Open Guild Control", to: "/admin/academy" },
                secondary: { label: "Browse Hunter Pass", to: "/pricing" },
              }}
            />
          }
        />

        {/* Cross-link to the module tier (Hunter Pass) */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-neon-amber/25 bg-neon-amber/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 shrink-0 text-neon-amber" />
            <p className="text-sm text-muted-foreground">
              Want a quick, topic-wise fix instead? Short{" "}
              <span className="font-medium text-neon-amber">module courses</span> start at just
              ₹399.
            </p>
          </div>
          <Link to="/pricing" className="shrink-0">
            <Button variant="neon" size="sm" className="h-10 w-full sm:w-auto">
              Browse Hunter Pass
            </Button>
          </Link>
        </div>

        {/* Search + mobile filter toggle */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a skill or pathway..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background/50 pl-11 pr-4 text-sm text-foreground transition-all focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-neon-cyan/30 bg-surface/60 px-4 font-display text-xs font-semibold uppercase tracking-widest text-neon-cyan transition-colors hover:bg-neon-cyan/10 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {selectedCategories.length > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-neon-cyan/20 text-[10px] font-bold">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Category sidebar */}
          <aside className={cn(filterOpen ? "block" : "hidden", "lg:block")}>
            <Panel accent="cyan" className="h-max">
              <PanelTitle
                right={
                  selectedCategories.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[10px] font-display font-semibold uppercase tracking-wider text-neon-cyan transition-colors hover:text-foreground"
                    >
                      Clear
                    </button>
                  ) : undefined
                }
              >
                Filter by Category
              </PanelTitle>
              <ul className="mt-4 space-y-2">
                {fullCourseCategories.map((c) => {
                  const checked = selectedCategories.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleCategory(c.id)}
                        className={cn(
                          "group flex w-full min-h-11 items-center gap-3 rounded-xl border-l-2 px-3 py-2 text-left transition-all duration-200",
                          checked
                            ? "border-neon-cyan bg-neon-cyan/10 text-foreground shadow-[inset_0_0_20px_-12px_color-mix(in_oklab,var(--neon-cyan)_80%,transparent)]"
                            : "border-transparent bg-surface/40 text-muted-foreground hover:border-neon-cyan/40 hover:bg-neon-cyan/5 hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border transition-colors",
                            checked
                              ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan"
                              : "border-border bg-background/60 text-muted-foreground group-hover:text-neon-cyan",
                          )}
                        >
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                          {c.name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 font-display text-[10px]",
                            checked
                              ? "bg-neon-cyan/20 text-neon-cyan"
                              : "bg-background/60 text-muted-foreground",
                          )}
                        >
                          {c.courseCount}
                        </span>
                        {checked && <Check className="h-4 w-4 shrink-0 text-neon-cyan" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-neon-cyan glow-text sm:text-base">
                Available Pathways
              </h2>
              <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-display text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  tone="cyan"
                  ctaLabel="Start Your Awakening"
                  enrolled={enrolledIds.has(course.id)}
                />
              ))}
              {filteredCourses.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
                  <Boxes className="h-10 w-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-display text-base font-bold text-foreground">
                      No pathways found matching your criteria
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adjust your search or clear the filters to see all available courses.
                    </p>
                    {selectedCategories.length > 0 && !selectionHasFullCourses && (
                      <p className="mt-3 text-sm text-neon-amber">
                        This content may be in Hunter Pass — short topic-wise modules.
                        <Link
                          to="/pricing"
                          className="ml-1 font-display uppercase tracking-wider text-neon-amber underline underline-offset-4 transition-colors hover:text-foreground"
                        >
                          Browse Hunter Pass
                        </Link>
                      </p>
                    )}
                  </div>
                  <Button variant="neon" size="sm" className="h-10" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
