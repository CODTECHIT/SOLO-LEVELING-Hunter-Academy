import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminUsersFn, updateUserRoleFn, deleteUserFn, createStaffUserFn } from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Trash2,
  UserPlus,
  Shield,
  Headphones,
  FolderTree,
  FileQuestion,
  Loader2,
  X,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/academy/users/staff")({
  loader: async () => {
    return await getAdminUsersFn({ data: { role: "ALL" } });
  },
  component: AdminStaff,
});

function AdminStaff() {
  const { users } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "TECHNICAL_TEAM" | "ADMIN">("MANAGER");
  const [isLoading, setIsLoading] = useState(false);

  const staff = users.filter((u) => u.role !== "STUDENT");

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createStaffUserFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        },
      });
      toast.success(`Staff account for ${name} created successfully.`);
      setIsCreating(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("MANAGER");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (
    id: string,
    newRole: "ADMIN" | "MANAGER" | "TECHNICAL_TEAM" | "STUDENT"
  ) => {
    try {
      await updateUserRoleFn({ data: { id, role: newRole } });
      toast.success("Role updated successfully.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff account?")) return;
    try {
      await deleteUserFn({ data: { id } });
      toast.success("Staff account deleted.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff account");
    }
  };

  const roleBadge = (r: string) => {
    switch (r) {
      case "ADMIN":
        return {
          label: "Super Admin",
          className: "border-neon-purple/40 bg-neon-purple/10 text-neon-purple",
          desc: "Full System & Platform Access",
        };
      case "MANAGER":
        return {
          label: "Manager",
          className: "border-neon-amber/40 bg-neon-amber/10 text-neon-amber",
          desc: "Courses, Categories, Quizzes & Hunters",
        };
      case "TECHNICAL_TEAM":
        return {
          label: "Technical Team",
          className: "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan",
          desc: "Customer Support Hub & Live Tickets",
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Staff & Role Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff members and allocate roles for Managers and Technical Support.
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => setIsCreating(!isCreating)}
          className="cursor-pointer"
        >
          {isCreating ? <X className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {isCreating ? "Cancel" : "Add Staff Member"}
        </Button>
      </div>

      {/* Role Capabilities Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel className="flex flex-col justify-between border-neon-purple/30 bg-surface/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-purple/50 bg-neon-purple/10 text-neon-purple">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">Super Admin</p>
              <span className="text-[10px] uppercase tracking-wider text-neon-purple font-semibold">
                Full Control
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete platform access: Courses, Financials, User Operations, CMS, Settings & Roles.
          </p>
        </Panel>

        <Panel className="flex flex-col justify-between border-neon-amber/30 bg-surface/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-amber/50 bg-neon-amber/10 text-neon-amber">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">Manager</p>
              <span className="text-[10px] uppercase tracking-wider text-neon-amber font-semibold">
                Courses, Categories & Hunters
              </span>
            </div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-amber" />
              <span>Courses & Lessons (Create & Manage)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5 text-neon-amber" />
              <span>Category List & Categories Management</span>
            </li>
            <li className="flex items-center gap-1.5">
              <FileQuestion className="h-3.5 w-3.5 text-neon-amber" />
              <span>Quizzes & CSV/JSON Import</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-amber" />
              <span>Students / Hunters Roster</span>
            </li>
          </ul>
        </Panel>

        <Panel className="flex flex-col justify-between border-neon-cyan/30 bg-surface/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">Technical Team</p>
              <span className="text-[10px] uppercase tracking-wider text-neon-cyan font-semibold">
                Support Hub
              </span>
            </div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5 text-neon-cyan" />
              <span>Customer Support Hub & Ticket Desk</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan ml-1 mr-1" />
              <span>Live Chat, Responses & Ticket Resolution</span>
            </li>
          </ul>
        </Panel>
      </div>

      {/* Add Staff Form Panel */}
      {isCreating && (
        <Panel accent="purple" className="animate-in slide-in-from-top-4 duration-300">
          <PanelTitle right={<UserPlus className="h-4 w-4 text-neon-purple" />}>
            Create New Staff Member
          </PanelTitle>
          <form onSubmit={handleCreateStaff} className="mt-4 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Staff Member Name"
                    className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@cybertech.academy"
                    className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-border bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "MANAGER" | "TECHNICAL_TEAM" | "ADMIN")}
                  className="w-full rounded-md border border-border bg-background/80 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                >
                  <option value="MANAGER">Manager (Categories & Quizzes)</option>
                  <option value="TECHNICAL_TEAM">Technical Team (Support Hub)</option>
                  <option value="ADMIN">Super Admin (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="neonPurple"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Staff Account"
                )}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* Active Staff Table */}
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
              <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                  No staff accounts found. Click "Add Staff Member" above to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}


