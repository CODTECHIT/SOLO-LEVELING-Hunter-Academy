import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/academy/cms/sliders")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/academy/reviews" });
  },
  component: () => null,
});
