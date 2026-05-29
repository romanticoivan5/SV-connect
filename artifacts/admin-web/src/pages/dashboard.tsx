import { useGetDashboardStats, useGetRecentRequests, useGetRequestBreakdown, getGetDashboardStatsQueryKey, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle, Clock, XCircle, Megaphone, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

const TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Clearance",
  certificate_of_residency: "Residency",
  business_permit: "Business",
  complaint: "Complaint",
  community_concern: "Concern",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useGetRecentRequests({ limit: 5 });
  const { data: breakdown } = useGetRequestBreakdown();
  const { data: pendingUsers } = useListUsers({ status: "pending" as any, limit: 1 });
  const pendingCount = (pendingUsers as any)?.total ?? 0;

  const statCards = [
    { label: "Total Residents", value: stats?.totalResidents, icon: Users, color: "blue", bg: "bg-blue-50", iconBg: "bg-blue-600", textColor: "text-blue-700" },
    { label: "Pending Requests", value: stats?.pendingRequests, icon: Clock, color: "amber", bg: "bg-amber-50", iconBg: "bg-amber-500", textColor: "text-amber-700" },
    { label: "Approved Requests", value: stats?.approvedRequests, icon: CheckCircle, color: "green", bg: "bg-green-50", iconBg: "bg-green-600", textColor: "text-green-700" },
    { label: "Rejected Requests", value: stats?.rejectedRequests, icon: XCircle, color: "red", bg: "bg-red-50", iconBg: "bg-red-500", textColor: "text-red-700" },
    { label: "Announcements", value: stats?.totalAnnouncements, icon: Megaphone, color: "purple", bg: "bg-purple-50", iconBg: "bg-purple-600", textColor: "text-purple-700" },
    { label: "Total Requests", value: stats?.totalRequests, icon: FileText, color: "slate", bg: "bg-slate-50", iconBg: "bg-slate-600", textColor: "text-slate-700" },
  ];

  const chartData = breakdown?.byType?.map((row: any) => ({
    name: TYPE_LABELS[row.label] ?? row.label,
    count: row.count,
  })) ?? [];

  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor your barangay's daily operations.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5">
          {format(new Date(), "EEEE, MMMM d yyyy")}
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Link href="/users/pending">
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {pendingCount} Pending Account{pendingCount > 1 ? "s" : ""} Awaiting Approval
                </p>
                <p className="text-amber-700 text-sm">Review new resident registrations</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className={`${card.bg} p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16 mt-2" />
                    ) : (
                      <p className={`text-3xl font-bold mt-1 ${card.textColor}`}>{card.value ?? 0}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Requests by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.04)" }}
                    contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Recent Requests
              </CardTitle>
              <Link href="/requests">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 px-2">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : !recent?.length ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((req) => (
                  <Link key={req.id} href={`/requests/${req.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        req.status === "approved" ? "bg-green-500" :
                        req.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{req.subject}</p>
                        <p className="text-xs text-slate-500 truncate">{req.user?.firstName} {req.user?.lastName}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] h-5 px-1.5 shrink-0 ${
                          req.status === "approved" ? "bg-green-100 text-green-700" :
                          req.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
