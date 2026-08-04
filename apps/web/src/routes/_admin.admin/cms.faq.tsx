import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/cms/faq')({
  component: AdminCmsFaq,
})

function AdminCmsFaq() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">FAQ Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage frequently asked questions.</p>
      </div>
      <Panel>
        <PanelTitle>FAQ Entries</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for Add/edit/delete FAQ entries.</p>
      </Panel>
    </div>
  )
}
