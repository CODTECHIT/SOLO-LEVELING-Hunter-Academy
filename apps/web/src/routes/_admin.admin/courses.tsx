import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { getAdminCoursesFn, toggleCoursePublishedFn, createCourseFn } from '@/server/admin'
import { Panel, PanelTitle } from '@/components/site/ui-bits'
import { Button } from '@/components/ui/button'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_admin/admin/courses')({
  loader: async () => {
    return await getAdminCoursesFn()
  },
  component: AdminCourses,
})

function AdminCourses() {
  const { courses, categories } = Route.useLoaderData()
  const router = useRouter()
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, categoryId: '' })

  const handleTogglePublished = async (courseId: string, currentStatus: boolean) => {
    await toggleCoursePublishedFn({ data: { courseId, published: !currentStatus } })
    router.invalidate()
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId) return alert("Select a category!")
    await createCourseFn({ data: formData })
    setIsCreating(false)
    setFormData({ title: '', description: '', price: 0, categoryId: '' })
    router.invalidate()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage academy training modules.</p>
        </div>
        <Button variant="hero" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      {isCreating && (
        <Panel accent="cyan" className="mb-6">
          <PanelTitle>Create New Course</PanelTitle>
          <form onSubmit={handleCreateCourse} className="mt-4 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Price (₹)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Category</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none">
                  <option value="" disabled>Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" variant="neon">Create Database Entry</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Course Title</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id} className="transition-colors hover:bg-surface-2/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{course.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{course.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-0.5 text-xs text-neon-purple">
                    {course.category.name}
                  </span>
                </td>
                <td className="px-6 py-4 font-display text-neon-cyan glow-text">₹{course.price}</td>
                <td className="px-6 py-4 text-center">
                  {course.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-neon-lime/30 bg-neon-lime/10 px-2 py-1 text-xs text-neon-lime">
                      <Eye className="h-3.5 w-3.5" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3.5 w-3.5" /> Draft
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm" className="border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
                        Lessons
                      </Button>
                    </Link>
                    <Button 
                      variant={course.published ? "ghost" : "neonPurple"} 
                      size="sm" 
                      onClick={() => handleTogglePublished(course.id, course.published)}
                    >
                      {course.published ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No courses found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
