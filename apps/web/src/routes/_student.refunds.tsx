import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_student/refunds")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
