import { ReactNode } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useGetMe, useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Bell, LayoutDashboard, FileText, Megaphone, Users, UserCircle, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user || user.role !== "admin") {
    clearToken();
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-6">
          <span className="font-bold text-sidebar-primary-foreground text-lg text-primary flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            BarangayConnect
          </span>
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav location={location} />
        </ScrollArea>
        <div className="p-4 mt-auto border-t">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.firstName[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 justify-between md:justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-6">
                <span className="font-bold text-primary flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  BarangayConnect
                </span>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarNav location={location} />
              </ScrollArea>
              <div className="p-4 border-t absolute bottom-0 w-full bg-background">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-4">
            <NotificationsMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ location }: { location: string }) {
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/requests", label: "Requests", icon: FileText },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/users", label: "Users", icon: Users },
    { href: "/profile", label: "Settings", icon: UserCircle },
  ];

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => {
        const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/dashboard");
        return (
          <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
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
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => markAllRead.mutate({})}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n) => (
                <div key={n.id} className="p-2 bg-muted/50 rounded-md text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground text-xs">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
