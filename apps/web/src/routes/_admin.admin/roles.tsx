import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/roles')({
  component: AdminRoles,
})

function AdminRoles() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure access control for the academy system.</p>
      </div>
      <Panel>
        <PanelTitle>Role Definitions</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for listing roles and checkbox matrix of permissions.</p>
      </Panel>
    </div>
  )
}
