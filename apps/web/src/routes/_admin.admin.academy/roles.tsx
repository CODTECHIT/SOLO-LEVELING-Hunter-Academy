import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  FolderTree,
  FileQuestion,
  Headphones,
  UserPlus,
  Users,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/academy/roles")({
  component: AdminRoles,
});

const SYSTEM_ROLES = [
  {
    role: "ADMIN",
    title: "Super Admin",
    subtitle: "Complete Platform Authority",
    badge: "bg-neon-purple/20 text-neon-purple border-neon-purple/40",
    icon: Shield,
    iconColor: "text-neon-purple",
    borderColor: "border-neon-purple/30",
    description:
      "Has unrestricted administrative control across all platform areas, settings, financial data, and user accounts.",
    permissions: [
      "Dashboard Overview & System Analytics",
      "Course Studio (Create, Edit & Delete Courses)",
      "Categories Management & Image Uploads",
      "Assessments & Quiz Question Import",
      "Customer Support Hub & Ticket Management",
      "User Operations (Student Management & Staff Role Allocation)",
      "Financials (Payment Logs, Reports & Refund Approvals)",
      "Content Management (Pages, FAQ, Sliders, Intro Videos)",
      "Platform Settings, Site Config & Student Reviews",
    ],
  },
  {
    role: "MANAGER",
    title: "Manager",
    subtitle: "Course Studio, Assessments & Hunter Operations",
    badge: "bg-neon-amber/20 text-neon-amber border-neon-amber/40",
    icon: FolderTree,
    iconColor: "text-neon-amber",
    borderColor: "border-neon-amber/30",
    description:
      "Dedicated operational access to manage Courses & Lessons, Category taxonomies, Quiz creation & bulk import, and Student/Hunter rosters.",
    permissions: [
      "Dashboard Overview Access",
      "Course Studio (Create, Edit, Publish & Delete Courses)",
      "Lesson Management (Video URLs, Descriptions & Ordering)",
      "Category Management (Create, Edit & Organize Categories)",
      "Assessments & Quizzes (Create, Edit & Delete Quizzes)",
      "Question Management & Bulk Question Import (CSV / JSON)",
      "Student / Hunter Operations & Enrollment Visibility",
    ],
  },
  {
    role: "TECHNICAL_TEAM",
    title: "Technical Team",
    subtitle: "Customer Support & Ticket Operations",
    badge: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40",
    icon: Headphones,
    iconColor: "text-neon-cyan",
    borderColor: "border-neon-cyan/30",
    description:
      "Dedicated access to the Customer Support Hub to assist students, resolve support tickets, and answer student inquiries.",
    permissions: [
      "Dashboard Overview Access",
      "Customer Support Hub (Support Desk)",
      "Ticket Lifecycle Management (Open, In Progress, Resolved, Closed)",
      "Ticket Messaging & Live Support Responses",
      "Priority and Category Categorization",
    ],
  },
];

function AdminRoles() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">System Roles & Access Matrix</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear role definitions and module permissions for Super Admin, Manager, and Technical Support.
          </p>
        </div>
        <Link to="/admin/academy/users/staff">
          <Button variant="hero">
            <UserPlus className="mr-2 h-4 w-4" /> Manage Staff & Assign Roles
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {SYSTEM_ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <Panel key={r.role} className={`flex flex-col justify-between ${r.borderColor} bg-surface/80`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-11 w-11 place-items-center rounded-xl border ${r.badge}`}>
                      <Icon className={`h-6 w-6 ${r.iconColor}`} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{r.title}</h2>
                      <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {r.description}
                </p>

                <div className="border-t border-border/50 pt-4">
                  <p className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Assigned Module Access:
                  </p>
                  <ul className="space-y-2 text-xs">
                    {r.permissions.map((perm, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground/90">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${r.iconColor}`} />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className={`inline-flex items-center text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${r.badge}`}>
                  {r.role}
                </span>
                <Link to="/admin/academy/users/staff">
                  <span className="text-xs text-neon-cyan hover:underline">
                    Assign to Staff &rarr;
                  </span>
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

