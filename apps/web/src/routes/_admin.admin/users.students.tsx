import { createFileRoute } from '@tanstack/react-router'
import { Panel, PanelTitle } from '@/components/site/ui-bits'

export const Route = createFileRoute('/_admin/admin/users/students')({
  component: AdminStudents,
})

function AdminStudents() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Students (Hunters)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage enrolled students across the academy.</p>
      </div>
      <Panel>
        <PanelTitle>Student Roster</PanelTitle>
        <p className="text-sm text-muted-foreground mt-4">Placeholder for students table: name, email, enrolled courses count, join date.</p>
      </Panel>
    </div>
  )
}
