import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminUsersFn, updateUserRoleFn, deleteUserFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/users/students")({
  loader: async () => {
    return await getAdminUsersFn({ data: { role: "STUDENT" } });
  },
  component: AdminStudents,
});

function AdminStudents() {
  const { users, total, studentCount } = Route.useLoaderData();
  const router = useRouter();

  const handleChangeRole = async (id: string, role: "ADMIN" | "SUB_ADMIN" | "STUDENT") => {
    await updateUserRoleFn({ data: { id, role } });
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this student?")) return;
    await deleteUserFn({ data: { id } });
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Students (Hunters)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage enrolled students across the academy.
        </p>
      </div>

      <Panel className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-lime/50 bg-surface-2 text-neon-lime">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Student Roster
          </p>
          <p className="font-display text-2xl font-bold text-neon-lime">{studentCount}</p>
        </div>
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Student Roster</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium text-center">Enrollments</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4 text-center font-display text-neon-lime">
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
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No students registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
