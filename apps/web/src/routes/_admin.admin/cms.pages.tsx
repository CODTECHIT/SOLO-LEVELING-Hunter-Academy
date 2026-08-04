import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/cms/pages')({
  component: AdminCmsPages,
})

function AdminCmsPages() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pages CMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Edit content for static pages.</p>
      </div>
      <Panel>
        <PanelTitle>Page Editor</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for rich text editor for About, Contact, Privacy, Terms.</p>
      </Panel>
    </div>
  )
}
