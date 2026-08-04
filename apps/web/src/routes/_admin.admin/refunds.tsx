import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/refunds')({
  component: AdminRefunds,
})

function AdminRefunds() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Refund Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage student refund claims.</p>
      </div>
      <Panel>
        <PanelTitle>Pending Requests</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for list of pending/approved/rejected refund requests and actions.</p>
      </Panel>
    </div>
  )
}
