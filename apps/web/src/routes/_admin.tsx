import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { getCurrentUserFn, logoutFn } from "@/server/auth";
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
  LogOut,
  Video,
  FileQuestion,
  Headphones,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/admin/academy/login" });
    }
    const staffRoles = ["ADMIN", "MANAGER", "TECHNICAL_TEAM"];
    if (!staffRoles.includes(user.role) && !user.customRoleId) {
      throw redirect({ to: user.role === "STUDENT" ? "/dashboard" : "/" });
    }
    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutFn();
    router.navigate({ to: "/admin/academy/login" });
  };

  const isSuperAdmin = user.role === "ADMIN";
  const isManager = user.role === "MANAGER";
  const isTechnicalTeam = user.role === "TECHNICAL_TEAM";

  const canManageCourses = isSuperAdmin || isManager;
  const canManageQuizzes = isSuperAdmin;
  const canManageSupport = isSuperAdmin || isTechnicalTeam;
  const canManageUsers = isSuperAdmin;
  const canManageFinancials = isSuperAdmin;
  const canManageCms = isSuperAdmin || isManager;
  const canManageSettings = isSuperAdmin;

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isManager) return "Manager";
    if (isTechnicalTeam) return "Technical Support";
    if (user.role === "SUB_ADMIN" || user.customRoleId) return "Sub Admin";
    return "Staff";
  };

  const getRoleBadgeTone = () => {
    if (isSuperAdmin) return "bg-neon-purple/20 text-neon-purple border-neon-purple/40";
    if (isManager) return "bg-neon-amber/20 text-neon-amber border-neon-amber/40";
    if (isTechnicalTeam) return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40";
    return "bg-neon-lime/20 text-neon-lime border-neon-lime/40";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface-2/50 p-6 flex flex-col justify-between h-screen sticky top-0">
        <div className="overflow-y-auto pr-2 flex-1">
          <div className="mb-6 flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CyberTech Logo"
              className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
            />
            <div>
              <h2 className="font-display text-lg font-bold text-neon-purple glow-text">
                Control Hub
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${getRoleBadgeTone()}`}>
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboard
            </div>
            <Link
              to="/admin/academy"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
            >
              <LayoutDashboard className="h-4 w-4" /> Overview
            </Link>

            {/* Courses & Categories (Super Admin & Manager) */}
            {canManageCourses && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Course Studio
                </div>
                <Link
                  to="/admin/academy/courses"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <BookOpen className="h-4 w-4" /> Course List
                </Link>
                <Link
                  to="/admin/academy/categories"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <FolderTree className="h-4 w-4" /> Categories
                </Link>
              </>
            )}

            {/* Quizzes & Assessments (Super Admin) */}
            {canManageQuizzes && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Assessments
                </div>
                <Link
                  to="/admin/academy/quizzes"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
                >
                  <FileQuestion className="h-4 w-4 text-neon-cyan" /> Quizzes & Import
                </Link>
              </>
            )}

            {/* Customer Support Desk (Technical Team & Super Admin) */}
            {canManageSupport && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Support Hub
                </div>
                <Link
                  to="/admin/academy/support"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="h-4 w-4 text-neon-lime" /> Support Desk
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-neon-lime animate-pulse" />
                </Link>
              </>
            )}

            {/* Users & Staff (Super Admin) */}
            {canManageUsers && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  User Operations
                </div>
                <Link
                  to="/admin/academy/users/students"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <Users className="h-4 w-4" /> Students
                </Link>
                <Link
                  to="/admin/academy/users/staff"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <UserPlus className="h-4 w-4" /> Staff
                </Link>
                <Link
                  to="/admin/academy/roles"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <Shield className="h-4 w-4" /> Roles
                </Link>
              </>
            )}

            {/* Financials (Super Admin) */}
            {canManageFinancials && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Financials
                </div>
                <Link
                  to="/admin/academy/reports"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
                >
                  <PieChart className="h-4 w-4" /> Reports
                </Link>
                <Link
                  to="/admin/academy/refunds"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
                >
                  <ReceiptRefund className="h-4 w-4" /> Refunds
                </Link>
              </>
            )}

            {/* CMS (Super Admin & Manager) */}
            {canManageCms && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Content Management
                </div>
                <Link
                  to="/admin/academy/cms/pages"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <FileText className="h-4 w-4" /> Pages
                </Link>
                <Link
                  to="/admin/academy/cms/faq"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <HelpCircle className="h-4 w-4" /> FAQ
                </Link>
                <Link
                  to="/admin/academy/cms/sliders"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <ImageIcon className="h-4 w-4" /> Sliders
                </Link>
                <Link
                  to="/admin/academy/cms/intro-video"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <Video className="h-4 w-4" /> Intro Video
                </Link>
              </>
            )}

            {/* Settings & Reviews (Super Admin) */}
            {canManageSettings && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Settings
                </div>
                <Link
                  to="/admin/academy/settings/site"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
                >
                  <Settings className="h-4 w-4" /> Site Config
                </Link>
                <Link
                  to="/admin/academy/settings/frontend"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
                >
                  <Monitor className="h-4 w-4" /> Frontend Manager
                </Link>
                <Link
                  to="/admin/academy/reviews"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan [&.active]:bg-neon-cyan/20 [&.active]:text-neon-cyan"
                >
                  <Star className="h-4 w-4" /> Reviews
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-border mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

