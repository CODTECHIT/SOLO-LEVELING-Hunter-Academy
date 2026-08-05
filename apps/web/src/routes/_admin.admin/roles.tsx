import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getAdminRolesFn,
  createRoleFn,
  updateRolePermissionsFn,
  deleteRoleFn,
} from "@/server/admin";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/roles")({
  loader: async () => {
    return await getAdminRolesFn();
  },
  component: AdminRoles,
});

const PERMISSIONS = [
  "courses",
  "users",
  "payments",
  "refunds",
  "reviews",
  "cms",
  "settings",
] as const;

function AdminRoles() {
  const { builtIn, customRoles } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const togglePerm = (perm: string) => setPermissions((prev) => ({ ...prev, [perm]: !prev[perm] }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoleFn({ data: { name: newRoleName, permissions } });
    setNewRoleName("");
    setPermissions({});
    setIsCreating(false);
    router.invalidate();
  };

  const handleSavePermissions = async (id: string) => {
    await updateRolePermissionsFn({ data: { id, permissions } });
    setEditingId(null);
    setPermissions({});
    router.invalidate();
  };

  const handleEdit = (id: string, current: Record<string, boolean>) => {
    setEditingId(id);
    setPermissions(current ?? {});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role? Users assigned to it will lose the custom role.")) return;
    await deleteRoleFn({ data: { id } });
    router.invalidate();
  };

  const renderPermissionCheckboxes = () => (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PERMISSIONS.map((perm) => (
        <label
          key={perm}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <input
            type="checkbox"
            checked={!!permissions[perm]}
            onChange={() => togglePerm(perm)}
            className="accent-[var(--neon-cyan)]"
          />
          <span className="capitalize">{perm}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure access control for the academy system.
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingId(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Role
        </Button>
      </div>

      {isCreating && !editingId && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>Create Custom Role</PanelTitle>
          <form onSubmit={handleCreate} className="mt-4 max-w-xl">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Role Name
            </label>
            <input
              required
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Course Manager"
              className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
            />
            {renderPermissionCheckboxes()}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon">
                Create Role
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <PanelTitle className="px-6 pt-5">Role Definitions</PanelTitle>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium text-center">Users</th>
              <th className="px-6 py-4 font-medium">Permissions</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {builtIn.map((role) => (
              <tr key={role.name} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-neon-amber/30 bg-neon-amber/10 text-neon-amber">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="font-display font-bold text-foreground">{role.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                    Built-in
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-display text-neon-amber">
                  {role.userCount}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-muted-foreground">
                    {role.name === "ADMIN"
                      ? "Full access"
                      : role.name === "SUB_ADMIN"
                        ? "All except roles"
                        : "Courses only"}
                  </span>
                </td>
                <td className="px-6 py-4" />
              </tr>
            ))}
            {customRoles.map((role) => (
              <tr key={role.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-neon-purple/30 bg-neon-purple/10 text-neon-purple">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="font-display font-bold text-foreground">{role.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-xs text-neon-purple">
                    Custom
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-display text-neon-purple">
                  {role._count.users}
                </td>
                <td className="px-6 py-4">
                  {editingId === role.id ? (
                    renderPermissionCheckboxes()
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(role.permissions as Record<string, boolean>)
                        .filter(([, v]) => v)
                        .map(([perm]) => (
                          <span
                            key={perm}
                            className="rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan"
                          >
                            {perm}
                          </span>
                        ))}
                      {Object.values(role.permissions as Record<string, boolean>).every(
                        (v) => !v,
                      ) && <span className="text-xs text-muted-foreground">No permissions</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === role.id ? (
                      <Button
                        variant="neon"
                        size="sm"
                        onClick={() => handleSavePermissions(role.id)}
                      >
                        Save
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                          onClick={() =>
                            handleEdit(role.id, (role.permissions ?? {}) as Record<string, boolean>)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role.id)}
                          className="text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
