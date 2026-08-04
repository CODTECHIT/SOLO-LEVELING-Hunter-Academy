import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/admin/payments')({
  component: AdminPayments,
})

function AdminPayments() {
  return <div>Admin Payments</div>
}
