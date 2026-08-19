import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/academy/settings/frontend")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/academy" });
  },
  component: () => null,
});
