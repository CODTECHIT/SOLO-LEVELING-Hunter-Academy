import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/categories')({
  component: AdminCategories,
})

function AdminCategories() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Category Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage course categories.</p>
      </div>
      <Panel>
        <PanelTitle>Categories List</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for listing, adding, editing, and deleting categories.</p>
      </Panel>
    </div>
  )
}
