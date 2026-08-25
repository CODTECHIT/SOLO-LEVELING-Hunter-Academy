import { useState } from "react";
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
  Award,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
    window.location.href = "/admin/academy/login";
  };

  const isSuperAdmin = user.role === "ADMIN";
  const isManager = user.role === "MANAGER";
  const isTechnicalTeam = user.role === "TECHNICAL_TEAM";

  const canManageCourses = isSuperAdmin || isManager;
  const canManageCategories = isSuperAdmin || isManager;
  const canManageCertificates = isSuperAdmin || isManager;
  const canManageQuizzes = isSuperAdmin || isManager;
  const canManageSupport = isSuperAdmin || isTechnicalTeam;
  const canManageStudents = isSuperAdmin || isManager;
  const canManageStaff = isSuperAdmin;
  const canManageFinancials = isSuperAdmin;
  const canManageReviews = isSuperAdmin || isManager;
  const canManageCms = isSuperAdmin || isManager;

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isManager) return "Manager";
    if (isTechnicalTeam) return "Technical Support";
    return "Staff";
  };

  const getRoleBadgeTone = () => {
    if (isSuperAdmin) return "bg-neon-purple/20 text-neon-purple border-neon-purple/40";
    if (isManager) return "bg-neon-amber/20 text-neon-amber border-neon-amber/40";
    if (isTechnicalTeam) return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40";
    return "bg-neon-lime/20 text-neon-lime border-neon-lime/40";
  };

  return (
    <div className="flex min-h-screen bg-background flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface-2/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="CyberTech Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-display text-xs font-black tracking-wider text-foreground">
              CONTROL HUB
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeTone()}`}
        >
          {getRoleLabel()}
        </span>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-border bg-surface-2 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
      >
        <div className="overflow-y-auto pr-2 flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CyberTech Logo"
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              />
              <div>
                <div className="font-display text-sm font-black tracking-wider text-foreground">
                  CONTROL HUB
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-neon-lime animate-pulse" />
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeTone()}`}
                  >
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden rounded-lg p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {/* Overview (All Staff) */}
            <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overview
            </div>
            <Link
              to="/admin/academy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
              activeOptions={{ exact: true }}
            >
              <LayoutDashboard className="h-4 w-4" /> System Overview
            </Link>

            {/* Courses & Certificates (Super Admin & Manager) */}
            {canManageCourses && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Course Studio
                </div>
                <Link
                  to="/admin/academy/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                >
                  <BookOpen className="h-4 w-4" /> Course Vault
                </Link>
                {canManageCategories && (
                  <Link
                    to="/admin/academy/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                  >
                    <FolderTree className="h-4 w-4" /> Categories
                  </Link>
                )}
                {canManageCertificates && (
                  <Link
                    to="/admin/academy/certificates"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                  >
                    <Award className="h-4 w-4" /> Certificates
                  </Link>
                )}
              </>
            )}

            {/* Quizzes & Assessments (Super Admin & Manager) */}
            {canManageQuizzes && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Assessments
                </div>
                <Link
                  to="/admin/academy/quizzes"
                  onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="h-4 w-4 text-neon-lime" /> Support Desk
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-neon-lime animate-pulse" />
                </Link>
              </>
            )}

            {/* Reviews Moderation (Super Admin & Manager) */}
            {canManageReviews && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Moderation
                </div>
                <Link
                  to="/admin/academy/reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
                >
                  <Star className="h-4 w-4 text-neon-amber" /> Reviews Moderation
                </Link>
              </>
            )}

            {/* Users & Staff (Super Admin & Manager for Students) */}
            {(canManageStudents || canManageStaff) && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  User Operations
                </div>
                {canManageStudents && (
                  <Link
                    to="/admin/academy/users/students"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                  >
                    <Users className="h-4 w-4" /> Students / Hunters
                  </Link>
                )}
                {canManageStaff && (
                  <Link
                    to="/admin/academy/users/staff"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-purple/10 hover:text-neon-purple [&.active]:bg-neon-purple/20 [&.active]:text-neon-purple"
                  >
                    <UserPlus className="h-4 w-4" /> Staff
                  </Link>
                )}
              </>
            )}

            {/* Financials (Super Admin Only) */}
            {canManageFinancials && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Financials
                </div>
                <Link
                  to="/admin/academy/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-amber/10 hover:text-neon-amber [&.active]:bg-neon-amber/20 [&.active]:text-neon-amber"
                >
                  <PieChart className="h-4 w-4" /> Financial Reports
                </Link>
              </>
            )}

            {/* Content Management (Super Admin & Manager) */}
            {canManageCms && (
              <>
                <div className="px-3 py-1.5 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Content Hub
                </div>
                <Link
                  to="/admin/academy/cms/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <HelpCircle className="h-4 w-4" /> FAQ
                </Link>
                <Link
                  to="/admin/academy/cms/intro-video"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-neon-lime/10 hover:text-neon-lime [&.active]:bg-neon-lime/20 [&.active]:text-neon-lime"
                >
                  <Video className="h-4 w-4" /> Intro Video
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

