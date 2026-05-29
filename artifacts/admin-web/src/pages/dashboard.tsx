import { useGetDashboardStats, useGetRecentRequests, useGetRequestBreakdown, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, XCircle, Megaphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useGetRecentRequests({ limit: 5 });
  const { data: breakdown, isLoading: breakdownLoading } = useGetRequestBreakdown();

  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
        <p className="text-muted-foreground">Monitor your barangay's daily operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Residents" value={stats?.totalResidents} icon={<Users className="h-4 w-4 text-primary" />} loading={statsLoading} />
        <StatCard title="Pending Requests" value={stats?.pendingRequests} icon={<Clock className="h-4 w-4 text-amber-500" />} loading={statsLoading} />
        <StatCard title="Approved Requests" value={stats?.approvedRequests} icon={<CheckCircle className="h-4 w-4 text-green-500" />} loading={statsLoading} />
        <StatCard title="Rejected Requests" value={stats?.rejectedRequests} icon={<XCircle className="h-4 w-4 text-destructive" />} loading={statsLoading} />
        <StatCard title="Announcements" value={stats?.totalAnnouncements} icon={<Megaphone className="h-4 w-4 text-primary" />} loading={statsLoading} />
        <StatCard title="Total Requests" value={stats?.totalRequests} icon={<FileText className="h-4 w-4 text-primary" />} loading={statsLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Requests by Type</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            {breakdownLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown?.byType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
              <div className="space-y-4">
                {recent?.map(req => (
                  <div key={req.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium leading-none">{req.subject}</p>
                      <p className="text-sm text-muted-foreground">{req.user?.firstName} {req.user?.lastName}</p>
                    </div>
                    <Link href={`/requests/${req.id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                  </div>
                ))}
                {!recent?.length && <p className="text-sm text-muted-foreground text-center py-4">No recent requests</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value || 0}</div>}
      </CardContent>
    </Card>
  );
}
