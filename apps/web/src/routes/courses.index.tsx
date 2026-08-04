import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, PlayCircle } from "lucide-react";
import { PageShell } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { getCatalogFn } from "@/server/courses";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/courses/")({
  loader: async () => {
    const data = await getCatalogFn();
    return data;
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
  const { courses, categories } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategories]);

  return (
    <PageShell
      title="System Catalog: Advanced Studies"
      subtitle="Browse and unlock modules individually or claim the full pathway."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <Panel accent="cyan" className="h-max">
          <PanelTitle>Category</PanelTitle>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="accent-[var(--neon-cyan)]"
                  />
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a skill, module or pathway..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {filteredCourses.map((course) => (
              <div key={course.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background/50 hover-glow transition-all">
                <div className="aspect-video bg-surface-2 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neon-cyan/20">
                      <PlayCircle className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6 relative z-10 -mt-10">
                  <span className="inline-flex items-center rounded-md bg-neon-purple/10 px-2 py-1 text-xs font-medium text-neon-purple ring-1 ring-inset ring-neon-purple/20 mb-4 w-fit">
                    {course.category.name}
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{course.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-display font-bold text-neon-cyan">₹{course.price.toLocaleString("en-IN")}</span>
                    <Link to="/courses/$slug" params={{ slug: course.slug }}>
                      <Button variant="neon" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No courses found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
