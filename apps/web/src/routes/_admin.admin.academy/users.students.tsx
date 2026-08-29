import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getAdminStudentsFn,
  updateStudentFn,
  deleteUserFn,
  adminEnrollStudentFn,
} from "@/server/admin";
import { Panel, PanelTitle, StatusTag } from "@/components/site/ui-bits";
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
  Flame,
  Calendar,
  BookPlus,
  Layers,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

type LoaderData = Awaited<ReturnType<typeof getAdminStudentsFn>>;
type StudentRow = LoaderData["students"][number];

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

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount == null || amount === 0) return "—";
  if (currency && currency !== "INR") return `${currency} ${amount}`;
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function AdminStudents() {
  const { students, total, pageSize, totalPages, categories, courses, metrics } =
    Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const q = search.q ?? "";
  const category = search.category ?? "ALL";
  const page = search.page ?? 1;

  const [query, setQuery] = useState(q);
  const [viewing, setViewing] = useState<StudentRow | null>(null);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<StudentRow | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);
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
        "Delete this student? This will remove their account, progress, enrollments, and reviews permanently.",
      )
    )
      return;
    try {
      setDeletingId(id);
      await deleteUserFn({ data: { id } });
      toast.success("Student deleted successfully");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (student: StudentRow) => {
    setEditing(student);
    setEditName(student.name);
    setEditPhone(student.phone ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      await updateStudentFn({ data: { id: editing.studentId, name: editName, phone: editPhone } });
      toast.success("Student details updated");
      setEditing(null);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const openEnroll = (student: StudentRow) => {
    setEnrollingStudent(student);
    setSelectedCourseId(courses?.[0]?.id || "");
  };

  const handleGrantAccess = async () => {
    if (!enrollingStudent || !selectedCourseId) return;
    try {
      setEnrolling(true);
      await adminEnrollStudentFn({
        data: {
          userId: enrollingStudent.studentId,
          courseId: selectedCourseId,
          expiresInDays: 365,
        },
      });
      toast.success("Course access granted to student!");
      setEnrollingStudent(null);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grant course access");
    } finally {
      setEnrolling(false);
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
          Track registered hunters, their login details, learning activity, and course progression.
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
        <PanelTitle className="px-6 pt-5">
          <div className="flex items-center gap-2">
            <span>Registered Students & Hunters</span>
            <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-xs text-neon-cyan">
              {total}
            </span>
          </div>
        </PanelTitle>

        <div className="flex flex-col gap-3 px-6 pb-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
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
              className="self-start sm:self-auto text-xs"
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
                : "No hunters registered yet. Invite hunters to join your academy."}
            </p>
            {isFiltering && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="ghost" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student / Hunter</th>
                    <th className="px-6 py-4 font-medium">Gmail / Email</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Courses Enrolled</th>
                    <th className="px-6 py-4 font-medium">Joined Date</th>
                    <th className="px-6 py-4 font-medium">Expiry Date</th>
                    <th className="px-6 py-4 font-medium">Amount Paid</th>
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
                            {student.currentStreak > 0 && (
                              <div className="flex items-center gap-1 text-[11px] text-neon-amber font-display">
                                <Flame className="h-3 w-3 fill-neon-amber" />
                                <span>{student.currentStreak}d streak</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {student.phone || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {student.enrollments.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                            Free Hunter
                          </span>
                        ) : student.enrollments.length === 1 ? (
                          <div>
                            <div className="font-medium text-foreground text-xs line-clamp-1 max-w-[200px]">
                              {student.enrollments[0].title}
                            </div>
                            <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.2 text-[10px] text-neon-cyan">
                              {student.enrollments[0].category}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-xs text-neon-purple font-medium">
                              {student.enrollments.length} Courses
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {formatDate(student.enrolledAt || student.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {student.expiresAt ? formatDate(student.expiresAt) : student.enrollments.length > 0 ? "365 Days" : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {formatAmount(student.amount, student.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusTag status={student.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewing(student)}
                            title="View student profile"
                            aria-label="View details"
                            className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEnroll(student)}
                            title="Grant course access"
                            aria-label="Grant course"
                            className="border border-neon-lime/30 text-neon-lime hover:bg-neon-lime/10 h-8 w-8"
                          >
                            <BookPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(student)}
                            title="Edit student"
                            aria-label="Edit student"
                            className="border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.studentId)}
                            disabled={deletingId === student.studentId}
                            title="Delete student"
                            aria-label="Delete student"
                            className="text-red-500 hover:bg-red-500/10 h-8 w-8"
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

      {/* VIEW STUDENT DETAILS MODAL */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl border-neon-cyan/30 bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="font-display text-neon-cyan flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Hunter Profile & Details
            </DialogTitle>
            <DialogDescription>Full student activity, enrolled courses, and payment records.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-surface-2/40 p-4">
                <Avatar className="h-14 w-14 border-2 border-neon-cyan/50 shadow-md">
                  <AvatarFallback className="bg-surface-2 font-display text-base text-neon-cyan">
                    {initials(viewing.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <div className="font-display text-lg font-bold text-foreground">
                    {viewing.name}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{viewing.email}</div>
                  {viewing.phone && (
                    <div className="text-xs text-muted-foreground">Phone: {viewing.phone}</div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined: {formatDate(viewing.createdAt)}
                    </span>
                    {viewing.currentStreak > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-neon-amber/40 bg-neon-amber/10 px-2 py-0.5 text-[10px] text-neon-amber font-display">
                        <Flame className="h-3 w-3 fill-neon-amber" /> {viewing.currentStreak} Day Streak
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <StatusTag status={viewing.status} />
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-surface-2/30 p-3 text-center">
                  <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    Courses
                  </div>
                  <div className="font-display text-lg font-bold text-neon-cyan">
                    {viewing.enrollments.length}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/30 p-3 text-center">
                  <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    Total Paid
                  </div>
                  <div className="font-display text-lg font-bold text-neon-lime">
                    {formatAmount(viewing.amount, viewing.currency)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/30 p-3 text-center">
                  <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    Best Streak
                  </div>
                  <div className="font-display text-lg font-bold text-neon-purple">
                    {viewing.longestStreak || 0}d
                  </div>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-neon-cyan" /> Enrolled Courses ({viewing.enrollments.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewing(null);
                      openEnroll(viewing);
                    }}
                    className="text-xs text-neon-lime hover:bg-neon-lime/10 h-7 px-2"
                  >
                    <BookPlus className="h-3.5 w-3.5 mr-1" /> Grant Course
                  </Button>
                </div>

                {viewing.enrollments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-surface-2/20 p-5 text-center">
                    <p className="text-xs text-muted-foreground">
                      This student has not enrolled in any courses yet.
                    </p>
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => {
                        setViewing(null);
                        openEnroll(viewing);
                      }}
                      className="mt-3 text-xs"
                    >
                      <BookPlus className="mr-1.5 h-3.5 w-3.5" /> Grant Course Access
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {viewing.enrollments.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-lg border border-border bg-surface-2/40 p-3 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-foreground text-sm">
                              {course.title}
                            </div>
                            <span className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan">
                              {course.category}
                            </span>
                          </div>
                          <StatusTag status={course.status} />
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-mono text-neon-cyan font-bold">
                              {course.completedLessons}/{course.totalLessons} lessons ({course.progressPercent}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                            <div
                              className="h-full bg-neon-cyan transition-all duration-300"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Dates & Amount */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                          <div>
                            Enrolled: <span className="text-foreground">{formatDate(course.enrolledAt)}</span>
                          </div>
                          <div>
                            Expires: <span className="text-foreground">{course.expiresAt ? formatDate(course.expiresAt) : "365 Days"}</span>
                          </div>
                          {course.amount && (
                            <div className="text-neon-lime font-medium">
                              Paid: {formatAmount(course.amount, course.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRANT COURSE ACCESS MODAL */}
      <Dialog open={enrollingStudent !== null} onOpenChange={(open) => !open && setEnrollingStudent(null)}>
        <DialogContent className="border-neon-lime/30 bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-neon-lime flex items-center gap-2">
              <BookPlus className="h-5 w-5" /> Grant Course Access
            </DialogTitle>
            <DialogDescription>
              Assign a course directly to <span className="text-foreground font-semibold">{enrollingStudent?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-display uppercase tracking-widest text-muted-foreground">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-md border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground focus:border-neon-lime focus:outline-none"
              >
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.price === 0 ? "Free" : `₹${c.price}`})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-neon-lime font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Instant Access Granted
              </div>
              <p>The student will immediately be able to access all lessons, quizzes, and track progress for 365 days.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEnrollingStudent(null)} disabled={enrolling}>
              Cancel
            </Button>
            <Button
              variant="neon"
              onClick={handleGrantAccess}
              disabled={enrolling || !selectedCourseId}
              className="border-neon-lime text-neon-lime hover:bg-neon-lime/10"
            >
              {enrolling ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT STUDENT MODAL */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="border-neon-purple/30 bg-background max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-neon-purple flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Edit Student
            </DialogTitle>
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
                  Phone Number
                </label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Email (Gmail)
                </label>
                <input
                  value={editing.email}
                  disabled
                  className="w-full rounded-md border border-border bg-surface-2/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Email cannot be changed directly.</span>
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
