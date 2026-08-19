import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/academy/settings/site")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/academy" });
  },
  component: () => null,
});
