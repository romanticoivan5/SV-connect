import { useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle, User, Mail, Phone, MapPin, Calendar, Users, Clock } from "lucide-react";
import { useState } from "react";

// Call our custom approve/reject endpoints via raw fetch (not in generated client)
async function approveUser(id: number, token: string) {
  const res = await fetch(`/api/users/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to approve");
  return res.json();
}

async function rejectUser(id: number, token: string) {
  const res = await fetch(`/api/users/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reject");
  return res.json();
}

function getToken() {
  return localStorage.getItem("barangay_token") ?? "";
}

export default function PendingApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<Record<number, "approving" | "rejecting">>({});

  const { data, isLoading, refetch } = useListUsers({ status: "pending" as any, limit: 100 });

  const handleApprove = async (id: number, name: string) => {
    setProcessing((p) => ({ ...p, [id]: "approving" }));
    try {
      await approveUser(id, getToken());
      toast({ title: "Account Approved", description: `${name}'s account is now active.` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch {
      toast({ variant: "destructive", title: "Failed to approve account" });
    } finally {
      setProcessing((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const handleReject = async (id: number, name: string) => {
    setProcessing((p) => ({ ...p, [id]: "rejecting" }));
    try {
      await rejectUser(id, getToken());
      toast({ title: "Account Rejected", description: `${name}'s registration has been rejected.` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch {
      toast({ variant: "destructive", title: "Failed to reject account" });
    } finally {
      setProcessing((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const pending = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Approvals</h2>
          <p className="text-muted-foreground mt-1">
            Review and approve new resident account registrations.
          </p>
        </div>
        {!isLoading && (
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Clock className="h-4 w-4 mr-1" />
            {pending.length} pending
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Users className="h-14 w-14 opacity-30" />
            <p className="text-lg font-medium">No pending registrations</p>
            <p className="text-sm">All accounts are up to date.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pending.map((user) => (
            <Card key={user.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900 overflow-hidden">
              <CardHeader className="pb-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center font-bold text-amber-700 text-lg">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{user.firstName} {user.lastName}</p>
                    <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-100/50 text-xs mt-0.5">
                      Pending Review
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span className="break-all">{user.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span>{user.contactNumber ?? "Not provided"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span>{user.address ?? "Not provided"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span>Registered {format(new Date(user.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                    onClick={() => handleApprove(user.id, `${user.firstName} ${user.lastName}`)}
                    disabled={!!processing[user.id]}
                  >
                    {processing[user.id] === "approving" ? (
                      <span className="flex items-center gap-1"><span className="animate-spin">⏳</span> Approving...</span>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-9"
                    onClick={() => handleReject(user.id, `${user.firstName} ${user.lastName}`)}
                    disabled={!!processing[user.id]}
                  >
                    {processing[user.id] === "rejecting" ? (
                      <span className="flex items-center gap-1"><span className="animate-spin">⏳</span> Rejecting...</span>
                    ) : (
                      <><XCircle className="h-4 w-4 mr-1" /> Reject</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
