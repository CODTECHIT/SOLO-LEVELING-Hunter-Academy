import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/reviews')({
  component: AdminReviews,
})

function AdminReviews() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Reviews Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and moderate student feedback.</p>
      </div>
      <Panel>
        <PanelTitle>Recent Reviews</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for viewing all reviews and hiding/removing inappropriate ones.</p>
      </Panel>
    </div>
  )
}
