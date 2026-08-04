import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/admin/users')({
  component: AdminUsers,
})

function AdminUsers() {
  return <div>Admin Users Management</div>
}
