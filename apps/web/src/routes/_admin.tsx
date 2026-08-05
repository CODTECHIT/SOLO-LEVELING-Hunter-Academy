import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { getCurrentUserFn } from "@/server/auth";
import { promoteToAdminFn } from "@/server/admin";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldAlert,
  FolderTree,
  Shield,
  PieChart,
  ReceiptText as ReceiptRefund,
  FileText,
  HelpCircle,
  ImageIcon,
  Settings,
  Monitor,
  Star,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  const handlePromote = async () => {
    await promoteToAdminFn();
    router.invalidate();
  };

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-neon-amber" />
        <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You must be a Guild Master (ADMIN) to access this sector.
        </p>

        {/* Temporary promotion button for testing — dev builds only. The server
            fn also refuses to promote in production. */}
        {import.meta.env.DEV && (
          <Button variant="neonPurple" className="mt-6" onClick={handlePromote}>
            Promote Me to Admin (Dev Mode)
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface-2/50 p-6">
        <div className="mb-8 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Solo Leveling Logo"
            className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
          />
          <div>
            <h2 className="font-display text-lg font-bold text-neon-purple glow-text">
              Guild Master
            </h2>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
              System Control
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboard
          </div>
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Courses
          </div>
          <Link
            to="/admin/courses"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <BookOpen className="h-4 w-4" /> Course List
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <FolderTree className="h-4 w-4" /> Categories
          </Link>

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Users
          </div>
          <Link
            to="/admin/users/students"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <Users className="h-4 w-4" /> Students
          </Link>
          <Link
            to="/admin/users/staff"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <UserPlus className="h-4 w-4" /> Staff
          </Link>
          <Link
            to="/admin/roles"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
          >
            <Shield className="h-4 w-4" /> Roles
          </Link>

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Financials
          </div>
          <Link
            to="/admin/reports"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
          >
            <PieChart className="h-4 w-4" /> Reports
          </Link>
          <Link
            to="/admin/refunds"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
          >
            <ReceiptRefund className="h-4 w-4" /> Refunds
          </Link>

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            CMS
          </div>
          <Link
            to="/admin/cms/pages"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
          >
            <FileText className="h-4 w-4" /> Pages
          </Link>
          <Link
            to="/admin/cms/faq"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
          >
            <HelpCircle className="h-4 w-4" /> FAQ
          </Link>
          <Link
            to="/admin/cms/sliders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
          >
            <ImageIcon className="h-4 w-4" /> Sliders
          </Link>

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settings
          </div>
          <Link
            to="/admin/settings/site"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
          >
            <Settings className="h-4 w-4" /> Site Config
          </Link>
          <Link
            to="/admin/settings/frontend"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
          >
            <Monitor className="h-4 w-4" /> Frontend Manager
          </Link>
          <Link
            to="/admin/reviews"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
          >
            <Star className="h-4 w-4" /> Reviews
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
