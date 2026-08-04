import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/reports')({
  component: AdminReports,
})

function AdminReports() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Financial Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">View academy revenue and transaction history.</p>
      </div>
      <Panel>
        <PanelTitle>Revenue Analytics</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for revenue by course, time filters, and CSV export.</p>
      </Panel>
    </div>
  )
}
