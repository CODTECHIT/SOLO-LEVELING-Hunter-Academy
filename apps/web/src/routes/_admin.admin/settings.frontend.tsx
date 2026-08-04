import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/settings/frontend')({
  component: AdminSettingsFrontend,
})

function AdminSettingsFrontend() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Frontend Manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customize public-facing pages.</p>
      </div>
      <Panel>
        <PanelTitle>Homepage Customization</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for editing Home page sections (hero text, Why Choose Us, Our Mission).</p>
      </Panel>
    </div>
  )
}
