import { useParams, useLocation } from "wouter";
import { useGetUser, useListRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern"
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive"
};

export default function UserDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const userId = parseInt(id || "0", 10);

  const { data: user, isLoading: userLoading } = useGetUser(userId);
  const { data: requests, isLoading: reqsLoading } = useListRequests({ userId, limit: 5 });

  if (userLoading) return <div className="space-y-4"><Skeleton className="h-8 w-[200px]" /><Skeleton className="h-[400px] w-full" /></div>;
  if (!user) return <div className="text-center py-10">User not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="gap-2 -ml-3" onClick={() => setLocation("/users")}>
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <UserCircle className="w-10 h-10" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{user.firstName} {user.lastName}</h2>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
            <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} className={user.status === 'active' ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20' : ''}>
              {user.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Contact Number</p>
              <p>{user.contactNumber || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
              <p>{user.address || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Account Created</p>
              <p>{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {reqsLoading ? (
              <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : !requests?.data || requests.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No requests found for this user.</p>
            ) : (
              <div className="space-y-3">
                {requests.data.map(req => (
                  <div key={req.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{TYPE_LABELS[req.type]}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(req.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_COLORS[req.status] || "default"}>
                        {req.status}
                      </Badge>
                      <Link href={`/requests/${req.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {requests.total > 5 && (
                  <Button variant="outline" className="w-full mt-2" onClick={() => setLocation(`/requests?userId=${user.id}`)}>
                    View All {requests.total} Requests
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
