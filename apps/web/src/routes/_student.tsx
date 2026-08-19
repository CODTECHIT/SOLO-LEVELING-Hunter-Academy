import { createFileRoute, Outlet, Link, useRouter, redirect } from '@tanstack/react-router';
import { TopNav, SiteFooter } from "@/components/site/nav";
import { LayoutDashboard, ShoppingBag, RotateCcw, UserCircle } from "lucide-react";
import { getCurrentUserFn } from "@/server/auth";

export const Route = createFileRoute('/_student')({
  loader: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      // Redirect like the dashboard's beforeLoad does, instead of letting the
      // layout loader throw (which surfaces a 500 "This page didn't load").
      throw redirect({ to: '/login' });
    }
    return { user };
  },
  component: StudentLayout,
})

function StudentLayout() {
  const { user } = Route.useLoaderData();
  const router = useRouter();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/purchases", icon: ShoppingBag, label: "Purchases" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 grid lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
        
        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold font-display uppercase text-xl">
              {user.name.substring(0, 2)}
            </div>
            <div>
              <div className="font-display font-bold text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">E-Rank Hunter</div>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-neon-cyan/10 hover:text-foreground"
                activeProps={{
                  className: "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20",
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation (Segmented Tabs) */}
        <nav className="lg:hidden grid grid-cols-3 gap-2 p-1 rounded-xl border border-border/80 bg-surface-2/60 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all text-muted-foreground text-center"
              activeProps={{
                className: "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_12px_rgba(0,243,255,0.2)] font-bold",
              }}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Main Content */}
        <main className="min-w-0">
          <Outlet />
        </main>
        
      </div>
      
      <SiteFooter />
    </div>
  )
}
