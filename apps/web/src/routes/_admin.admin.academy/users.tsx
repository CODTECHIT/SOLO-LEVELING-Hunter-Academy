import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/academy/users")({
  beforeLoad: ({ location }) => {
    if (location.pathname.replace(/\/+$/, "") === "/admin/academy/users") {
      throw redirect({ to: "/admin/academy/users/students" });
    }
  },
  component: () => <Outlet />,
});
