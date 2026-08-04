import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_student/my-courses')({
  component: MyCourses,
})

function MyCourses() {
  return <div className="p-4">My Enrolled Courses</div>
}
