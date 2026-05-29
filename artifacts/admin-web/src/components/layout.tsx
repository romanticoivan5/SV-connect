import { ReactNode } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useGetMe, useListNotifications, useMarkAllNotificationsRead, useListUsers } from "@workspace/api-client-react";
import { Bell, LayoutDashboard, FileText, Megaphone, Users, UserCircle, LogOut, Menu, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    clearToken();
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-slate-100 md:flex shadow-xl">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">SV Connect</p>
            <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <SidebarNav location={location} />
        </ScrollArea>

        {/* User footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
              {user.firstName[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800 h-9"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 lg:px-6 justify-between shadow-sm">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-slate-100 border-slate-700">
              <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">SV Connect</p>
                  <p className="text-slate-400 text-xs">Admin Portal</p>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)] py-4">
                <SidebarNav location={location} />
              </ScrollArea>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page breadcrumb */}
          <div className="flex-1">
            <PageTitle location={location} />
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                {user.firstName[0]}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block">
                {user.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-slate-50 dark:bg-slate-950">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function PageTitle({ location }: { location: string }) {
  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/requests": "Requests",
    "/announcements": "Announcements",
    "/users": "User Management",
    "/users/pending": "Pending Approvals",
    "/profile": "Settings",
  };
  const title = Object.entries(titles).find(([path]) =>
    path === location || (location.startsWith(path + "/") && path !== "/")
  )?.[1] ?? "SV Connect";
  return <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h1>;
}

function SidebarNav({ location }: { location: string }) {
  const { data: pendingData } = useListUsers({ status: "pending" as any, limit: 1 });
  const pendingCount = (pendingData as any)?.total ?? 0;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: null },
    { href: "/requests", label: "Requests", icon: FileText, section: "Management" },
    { href: "/announcements", label: "Announcements", icon: Megaphone, section: null },
    { href: "/users", label: "All Users", icon: Users, section: "Users" },
    { href: "/users/pending", label: "Pending Approvals", icon: Clock, section: null, badge: pendingCount },
    { href: "/profile", label: "Settings", icon: UserCircle, section: "Account" },
  ];

  let lastSection: string | null = "";

  return (
    <nav className="px-3 space-y-0.5">
      {navItems.map((item) => {
        const showDivider = item.section !== null && item.section !== lastSection;
        lastSection = item.section;
        const isActive = location === item.href ||
          (item.href !== "/dashboard" && item.href !== "/users" && location.startsWith(item.href + "/")) ||
          (item.href === "/users" && location === "/users");

        return (
          <div key={item.href}>
            {showDivider && item.section && (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-5 pb-2">
                {item.section}
              </p>
            )}
            <Link href={item.href}>
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer group",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs h-5 min-w-5 px-1.5">
                    {item.badge}
                  </Badge>
                ) : isActive ? (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                ) : null}
              </div>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

function NotificationsMenu() {
  const { data: notifs } = useListNotifications({ unreadOnly: true });
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifs?.unreadCount || 0;
  const notifications = notifs?.data || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex justify-between items-center p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => markAllRead.mutate({})}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No new notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
