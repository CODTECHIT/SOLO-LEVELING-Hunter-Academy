import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { getAdminUsersFn, updateUserRoleFn, deleteUserFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Users as UsersIcon, GraduationCap, ShieldCheck, Trash2, Search, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/users")({
  loader: async () => {
    return await getAdminUsersFn({ data: { role: "ALL" } });
  },
  component: AdminUsers,
});

function RoleBadge({ role }: { role: "ADMIN" | "SUB_ADMIN" | "STUDENT" }) {
  const tone =
    role === "ADMIN"
      ? "border-neon-amber/40 bg-neon-amber/10 text-neon-amber"
      : role === "SUB_ADMIN"
        ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
        : "border-neon-lime/40 bg-neon-lime/10 text-neon-lime";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tone}`}>
      {role === "ADMIN" ? "Admin" : role === "SUB_ADMIN" ? "Sub Admin" : "Student"}
    </span>
  );
}

function AdminUsers() {
  const { users, categories, total, studentCount, staffCount } = Route.useLoaderData();
  const router = useRouter();

  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "SUB_ADMIN" | "STUDENT">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const query = search.trim().toLowerCase();
  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (categoryFilter !== "ALL" && !u.categories.some((c) => c.id === categoryFilter))
      return false;
    if (query && ![u.name, u.email, u.id].some((v) => v.toLowerCase().includes(query)))
      return false;
    return true;
  });

  const isFiltering = query.length > 0 || categoryFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
  };

  const handleChangeRole = async (id: string, role: "ADMIN" | "SUB_ADMIN" | "STUDENT") => {
    await updateUserRoleFn({ data: { id, role } });
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This removes their enrollments, payments, and reviews."))
      return;
    try {
      await deleteUserFn({ data: { id } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const filterBtn = (value: "ALL" | "ADMIN" | "SUB_ADMIN" | "STUDENT", label: string) => (
    <button
      onClick={() => setRoleFilter(value)}
      className={`rounded-md px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors ${
        roleFilter === value
          ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40"
          : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage every account in the academy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-cyan/50 bg-surface-2 text-neon-cyan">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Total Users
            </p>
            <p className="font-display text-2xl font-bold text-neon-cyan">{total}</p>
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-lime/50 bg-surface-2 text-neon-lime">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Students
            </p>
            <p className="font-display text-2xl font-bold text-neon-lime">{studentCount}</p>
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-amber/50 bg-surface-2 text-neon-amber">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Staff
            </p>
            <p className="font-display text-2xl font-bold text-neon-amber">{staffCount}</p>
          </div>
        </Panel>
      </div>

      <div className="flex items-center gap-2">
        {filterBtn("ALL", "All")}
        {filterBtn("STUDENT", "Students")}
        {filterBtn("SUB_ADMIN", "Sub Admins")}
        {filterBtn("ADMIN", "Admins")}
        <div className="ml-auto flex gap-2">
          <Link to="/admin/academy/users/students">
            <Button
              variant="ghost"
              size="sm"
              className="border border-neon-lime/30 text-neon-lime hover:bg-neon-lime/10"
            >
              Students
            </Button>
          </Link>
          <Link to="/admin/academy/users/staff">
            <Button
              variant="ghost"
              size="sm"
              className="border border-neon-amber/30 text-neon-amber hover:bg-neon-amber/10"
            >
              Staff
            </Button>
          </Link>
        </div>
      </div>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Registered Hunters</PanelTitle>

        <div className="flex flex-col gap-3 px-6 pb-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or user ID..."
              className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-neon-cyan focus:outline-none"
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

        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium text-center">Enrollments</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-center font-display text-neon-cyan">
                  {user._count.enrollments}
                </td>
                <td className="px-6 py-4 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleChangeRole(
                          user.id,
                          e.target.value as "ADMIN" | "SUB_ADMIN" | "STUDENT",
                        )
                      }
                      className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="SUB_ADMIN">Sub Admin</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
