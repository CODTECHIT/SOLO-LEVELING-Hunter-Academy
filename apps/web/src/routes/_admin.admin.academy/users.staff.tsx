import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminUsersFn, updateUserRoleFn, deleteUserFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, UserPlus, Shield, Wrench, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/academy/users/staff")({
  loader: async () => {
    return await getAdminUsersFn({ data: { role: "ALL" } });
  },
  component: AdminStaff,
});

function AdminStaff() {
  const { users, staffCount } = Route.useLoaderData();
  const router = useRouter();

  const staff = users.filter((u) => u.role !== "STUDENT");

  const handleChangeRole = async (
    id: string,
    role: "ADMIN" | "MANAGER" | "TECHNICAL_TEAM" | "STUDENT"
  ) => {
    await updateUserRoleFn({ data: { id, role } });
    router.invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff account?")) return;
    await deleteUserFn({ data: { id } });
    router.invalidate();
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Super Admin",
          className: "border-neon-purple/40 bg-neon-purple/10 text-neon-purple",
          desc: "Full System Access",
        };
      case "MANAGER":
        return {
          label: "Manager",
          className: "border-neon-amber/40 bg-neon-amber/10 text-neon-amber",
          desc: "Courses & Categories",
        };
      case "TECHNICAL_TEAM":
        return {
          label: "Technical Team",
          className: "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan",
          desc: "Customer Support Desk",
        };
      default:
        return {
          label: "Staff",
          className: "border-border bg-surface text-muted-foreground",
          desc: "Standard Access",
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Staff & Role Allocation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage Super Admin, Manager, and Technical Team staff roles and access levels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-purple/50 bg-neon-purple/10 text-neon-purple">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Super Admin
            </p>
            <p className="text-xs text-muted-foreground">All platform modules & settings</p>
          </div>
        </Panel>

        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-amber/50 bg-neon-amber/10 text-neon-amber">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Manager
            </p>
            <p className="text-xs text-muted-foreground">Course & Category CRUD operations</p>
          </div>
        </Panel>

        <Panel className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">
              Technical Team
            </p>
            <p className="text-xs text-muted-foreground">Customer Support Desk & Live Chat</p>
          </div>
        </Panel>
      </div>

      <Panel className="p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <PanelTitle>Active Staff Roster ({staff.length})</PanelTitle>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Staff Member</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Assigned Role</th>
              <th className="px-6 py-4 font-medium">Module Access</th>
              <th className="px-6 py-4 font-medium text-right">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((user) => {
              const badge = roleBadge(user.role);
              return (
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
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {badge.desc}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleChangeRole(
                            user.id,
                            e.target.value as "ADMIN" | "MANAGER" | "TECHNICAL_TEAM" | "STUDENT"
                          )
                        }
                        className="rounded-md border border-border bg-background/80 px-2.5 py-1 text-xs text-foreground focus:border-neon-cyan focus:outline-none"
                      >
                        <option value="ADMIN">Super Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="TECHNICAL_TEAM">Technical Team</option>
                        <option value="STUDENT">Demote to Student</option>
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
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
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

