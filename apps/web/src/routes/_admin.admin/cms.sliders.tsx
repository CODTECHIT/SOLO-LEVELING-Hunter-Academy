import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/cms/sliders')({
  component: AdminCmsSliders,
})

function AdminCmsSliders() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Sliders & Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage homepage hero banners.</p>
      </div>
      <Panel>
        <PanelTitle>Hero Images</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for uploading and managing homepage slider images and links.</p>
      </Panel>
    </div>
  )
}
