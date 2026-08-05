import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminUsersFn, updateUserRoleFn, deleteUserFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/users/staff")({
  loader: async () => {
    return await getAdminUsersFn({ data: { role: "ALL" } });
  },
  component: AdminStaff,
});

function AdminStaff() {
  const { users, staffCount } = Route.useLoaderData();
  const router = useRouter();

  const staff = users.filter((u) => u.role === "ADMIN" || u.role === "SUB_ADMIN");

  const handleChangeRole = async (id: string, role: "ADMIN" | "SUB_ADMIN" | "STUDENT") => {
    await updateUserRoleFn({ data: { id, role } });
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff account?")) return;
    await deleteUserFn({ data: { id } });
    router.invalidate();
  };

  const roleTone = (role: string) =>
    role === "ADMIN"
      ? "border-neon-amber/40 bg-neon-amber/10 text-neon-amber"
      : "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Staff Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage administrative and instructor accounts.
        </p>
      </div>

      <Panel className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-amber/50 bg-surface-2 text-neon-amber">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Staff Roster
          </p>
          <p className="font-display text-2xl font-bold text-neon-amber">{staffCount}</p>
        </div>
      </Panel>

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Staff Accounts</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${roleTone(user.role)}`}
                  >
                    {user.role === "ADMIN" ? "Admin" : "Sub Admin"}
                  </span>
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
                      <option value="SUB_ADMIN">Sub Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STUDENT">Student</option>
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
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No staff accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
