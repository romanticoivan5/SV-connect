import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetRequest, useApproveRequest, useRejectRequest, getListRequestsQueryKey, getGetRequestQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern"
};

export default function RequestDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reqId = parseInt(id || "0", 10);

  const { data: req, isLoading } = useGetRequest(reqId);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const approve = useApproveRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request approved" });
        queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(reqId) });
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        setAction(null);
      }
    }
  });

  const reject = useRejectRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request rejected" });
        queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(reqId) });
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        setAction(null);
      }
    }
  });

  const handleAction = () => {
    if (action === "approve") {
      approve.mutate({ id: reqId, data: { remarks } });
    } else if (action === "reject") {
      reject.mutate({ id: reqId, data: { remarks } });
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-[200px]" /><Skeleton className="h-[400px] w-full" /></div>;
  if (!req) return <div className="text-center py-10">Request not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="gap-2 -ml-3" onClick={() => setLocation("/requests")}>
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{req.subject}</h2>
            <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Submitted on {format(new Date(req.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>

        {req.status === 'pending' && (
          <div className="flex gap-2">
            <Dialog open={action === "reject"} onOpenChange={(open) => { setAction(open ? "reject" : null); setRemarks(""); }}>
              <DialogTrigger asChild>
                <Button variant="destructive"><XCircle className="h-4 w-4 mr-2" /> Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Request</DialogTitle>
                  <DialogDescription>
                    Provide a reason for rejecting this request (optional).
                  </DialogDescription>
                </DialogHeader>
                <Textarea placeholder="Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleAction} disabled={reject.isPending}>Confirm Reject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={action === "approve"} onOpenChange={(open) => { setAction(open ? "approve" : null); setRemarks(""); }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-4 w-4 mr-2" /> Approve</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Request</DialogTitle>
                  <DialogDescription>
                    Provide any remarks for this approval (optional).
                  </DialogDescription>
                </DialogHeader>
                <Textarea placeholder="Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button onClick={handleAction} disabled={approve.isPending}>Confirm Approve</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                <p>{TYPE_LABELS[req.type]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap text-sm">
                  {req.description}
                </div>
              </div>
              {req.remarks && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Processing Remarks</p>
                  <div className="bg-muted/30 p-4 rounded-md border-l-4 border-primary whitespace-pre-wrap text-sm">
                    {req.remarks}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requester Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                <p>{req.user?.firstName} {req.user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p>{req.user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Contact</p>
                <p>{req.user?.contactNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                <p>{req.user?.address || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {req.processedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Processed On</p>
                  <p>{format(new Date(req.processedAt), "MMM d, yyyy h:mm a")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
