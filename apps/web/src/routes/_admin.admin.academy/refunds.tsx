import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/academy/refunds")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/academy/reports" });
  },
  component: () => null,
});
