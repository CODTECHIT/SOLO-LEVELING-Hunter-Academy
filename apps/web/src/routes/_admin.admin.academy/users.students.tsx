import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminStudentsFn, updateStudentFn, deleteUserFn } from "@/server/admin";
import { Panel, PanelTitle, StatusTag, XPBar } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users as UsersIcon,
  Activity,
  UserPlus,
  BookOpen,
  GraduationCap,
  Search,
  X,
  Trash2,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

type LoaderData = Awaited<ReturnType<typeof getAdminStudentsFn>>;
type Student = LoaderData["students"][number];

interface StudentsSearch {
  q?: string;
  category?: string;
  page?: number;
}

export const Route = createFileRoute("/_admin/admin/academy/users/students")({
  validateSearch: (search): StudentsSearch => {
    const raw = (search ?? {}) as Record<string, unknown>;
    return {
      q: typeof raw.q === "string" ? raw.q : undefined,
      category: typeof raw.category === "string" ? raw.category : undefined,
      page: typeof raw.page === "number" && raw.page >= 1 ? Math.floor(raw.page) : undefined,
    };
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) =>
    await getAdminStudentsFn({
      data: {
        search: deps.search.q || undefined,
        categoryId:
          deps.search.category && deps.search.category !== "ALL" ? deps.search.category : undefined,
        page: deps.search.page ?? 1,
      },
    }),
  component: AdminStudents,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AdminStudents() {
  const { students, total, pageSize, totalPages, categories, metrics } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const q = search.q ?? "";
  const category = search.category ?? "ALL";
  const page = search.page ?? 1;

  const [query, setQuery] = useState(q);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== q) {
        navigate({ search: (prev) => ({ ...prev, q: query, page: 1 }) });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, q, navigate]);

  const setCategory = (next: string) =>
    navigate({ search: (prev) => ({ ...prev, category: next, page: 1 }) });

  const goToPage = (p: number) => navigate({ search: (prev) => ({ ...prev, page: p }) });

  const isFiltering = query.trim().length > 0 || category !== "ALL";

  const resetFilters = () => {
    setQuery("");
    navigate({ search: (prev) => ({ ...prev, q: "", category: "ALL", page: 1 }) });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this student? This removes their enrollments, progress, payments, and reviews.",
      )
    )
      return;
    try {
      setDeletingId(id);
      await deleteUserFn({ data: { id } });
      toast.success("Student deleted");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setEditName(student.name);
    setEditPhone(student.phone ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      await updateStudentFn({ data: { id: editing.id, name: editName, phone: editPhone } });
      toast.success("Student updated");
      setEditing(null);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const metricCards = [
    {
      label: "Total Students",
      value: metrics.totalStudents,
      icon: UsersIcon,
      iconClass: "text-neon-cyan border-neon-cyan/50",
    },
    {
      label: "Active Students",
      value: metrics.activeStudents,
      icon: Activity,
      iconClass: "text-neon-lime border-neon-lime/50",
    },
    {
      label: "New This Month",
      value: metrics.newThisMonth,
      icon: UserPlus,
      iconClass: "text-neon-purple border-neon-purple/50",
    },
    {
      label: "Course Enrollments",
      value: metrics.totalEnrollments,
      icon: BookOpen,
      iconClass: "text-neon-amber border-neon-amber/50",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Student Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track who your hunters are, what they're learning, and how they're progressing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Panel key={card.label} className="flex items-center gap-4">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl border bg-surface-2 ${card.iconClass}`}
            >
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Student Roster</PanelTitle>

        <div className="flex flex-col gap-3 px-6 pb-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-neon-cyan focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  navigate({ search: (prev) => ({ ...prev, q: "", page: 1 }) });
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none sm:w-56"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="self-start sm:self-auto"
            >
              Reset filters
            </Button>
          )}
        </div>

        {students.length === 0 ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-neon-purple/30 bg-surface-2 text-neon-purple">
              <GraduationCap className="h-7 w-7" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-foreground">No students found</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {isFiltering
                ? "No students match the current search or category filter."
                : "Invite hunters to join your academy and start ranking up."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                variant="hero"
                onClick={() => toast.info("Student invitations are coming soon")}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Invite Students
              </Button>
              {isFiltering && (
                <Button variant="ghost" onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium text-center">Enrolled Courses</th>
                    <th className="px-6 py-4 font-medium">Learning Progress</th>
                    <th className="px-6 py-4 font-medium text-center">Certificates</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-surface-2/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-neon-purple/40">
                            <AvatarFallback className="bg-surface-2 font-display text-xs text-neon-cyan">
                              {initials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-display text-neon-cyan">
                        {student.enrolledCount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-28 min-w-0">
                          <XPBar value={student.progressPercent} accent="lime" label="Progress" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-muted-foreground">—</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(student.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusTag status={student.active ? "Active" : "Inactive"} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewing(student)}
                            aria-label="View profile"
                            className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(student)}
                            aria-label="Edit student"
                            className="border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                            disabled={deletingId === student.id}
                            aria-label="Delete student"
                            className="text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {total === 0 ? "No results" : `Showing ${start}–${end} of ${total} students`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="font-display">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="border-neon-cyan/30 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-neon-cyan">Student Profile</DialogTitle>
            <DialogDescription>Enrollment and progress details.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-neon-purple/40">
                  <AvatarFallback className="bg-surface-2 font-display text-sm text-neon-cyan">
                    {initials(viewing.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-display text-base font-bold text-foreground">
                    {viewing.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{viewing.email}</div>
                </div>
                <div className="ml-auto">
                  <StatusTag status={viewing.active ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <p className="font-display text-xl font-bold text-neon-cyan">
                    {viewing.enrolledCount}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Courses
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <p className="font-display text-xl font-bold text-neon-lime">
                    {viewing.progressPercent}%
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Progress
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <p className="font-display text-xl font-bold text-muted-foreground">—</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Certificates
                  </p>
                </div>
              </div>
              {viewing.phone && (
                <p className="text-xs text-muted-foreground">Phone: {viewing.phone}</p>
              )}
              <div>
                <p className="mb-2 text-xs font-display uppercase tracking-widest text-muted-foreground">
                  Enrolled Courses
                </p>
                {viewing.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No enrolled courses yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {viewing.courses.map((course) => (
                      <li
                        key={course.id}
                        className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{course.title}</span>
                        <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan">
                          {course.category}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-neon-purple/30 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-neon-purple">Edit Student</DialogTitle>
            <DialogDescription>Update the student's profile details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Full Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Phone
                </label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Not set"
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  onClick={handleSaveEdit}
                  disabled={saving || editName.trim().length < 2}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
