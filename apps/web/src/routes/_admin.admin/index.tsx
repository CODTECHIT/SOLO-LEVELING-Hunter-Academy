import { createFileRoute } from '@tanstack/react-router'
import { getAdminStatsFn } from '@/server/admin'
import { Panel } from '@/components/site/ui-bits'
import { Users, BookOpen, GraduationCap, Coins } from 'lucide-react'

export const Route = createFileRoute('/_admin/admin/')({
  loader: async () => {
    return await getAdminStatsFn()
  },
  component: AdminDashboard,
})

function MetricCard({ title, value, icon: Icon, accent }: { title: string, value: string | number, icon: any, accent: 'cyan' | 'lime' | 'purple' | 'amber' }) {
  const accentColors = {
    cyan: 'text-neon-cyan border-neon-cyan/50',
    lime: 'text-neon-lime border-neon-lime/50',
    purple: 'text-neon-purple border-neon-purple/50',
    amber: 'text-neon-amber border-neon-amber/50',
  }
  
  return (
    <Panel className="flex items-center gap-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-surface-2 ${accentColors[accent]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">{title}</p>
        <p className={`font-display text-2xl font-bold ${accentColors[accent].split(' ')[0]}`}>{value}</p>
      </div>
    </Panel>
  )
}

function AdminDashboard() {
  const stats = Route.useLoaderData()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">System Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor academy metrics and hunter activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Registered Hunters" value={stats.totalUsers} icon={Users} accent="cyan" />
        <MetricCard title="Active Courses" value={stats.totalCourses} icon={BookOpen} accent="purple" />
        <MetricCard title="Total Enrollments" value={stats.totalEnrollments} icon={GraduationCap} accent="lime" />
        <MetricCard title="System Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={Coins} accent="amber" />
      </div>
    </div>
  )
}
