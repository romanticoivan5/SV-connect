import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetRequest, useApproveRequest, useRejectRequest, getListRequestsQueryKey, getGetRequestQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern",
};

function safeDateFormat(value: string | null | undefined, fmt: string): string {
  if (!value) return "—";
  try {
    return format(new Date(value), fmt);
  } catch {
    return String(value);
  }
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reqId = Number(id);

  const { data: req, isLoading, isError } = useGetRequest(reqId, {
    query: { enabled: !!reqId && reqId > 0 },
  });

  const [remarks, setRemarks] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const approve = useApproveRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request approved successfully" });
        queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(reqId) });
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        setConfirmAction(null);
        setRemarks("");
      },
      onError: () => toast({ variant: "destructive", title: "Failed to approve request" }),
    },
  });

  const reject = useRejectRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "Request rejected" });
        queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(reqId) });
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        setConfirmAction(null);
        setRemarks("");
      },
      onError: () => toast({ variant: "destructive", title: "Failed to reject request" }),
    },
  });

  const handleConfirm = () => {
    if (confirmAction === "approve") {
      approve.mutate({ id: reqId, data: { remarks: remarks || undefined } });
    } else if (confirmAction === "reject") {
      reject.mutate({ id: reqId, data: { remarks: remarks || undefined } });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError || !req) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Request not found or could not be loaded.</p>
        <Button variant="outline" onClick={() => setLocation("/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Requests
        </Button>
      </div>
    );
  }

  const statusBadge = {
    pending: <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>,
    approved: <Badge className="bg-green-600 text-white gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>,
    rejected: <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>,
  }[req.status] ?? <Badge>{req.status}</Badge>;

  // Inline confirm panel instead of Dialog (avoids Radix portal issues)
  if (confirmAction) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" className="gap-2 -ml-3" onClick={() => { setConfirmAction(null); setRemarks(""); }}>
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Button>
        <Card className={confirmAction === "reject" ? "border-destructive" : "border-green-500"}>
          <CardHeader>
            <CardTitle className={confirmAction === "reject" ? "text-destructive" : "text-green-700"}>
              {confirmAction === "approve" ? "Approve Request" : "Reject Request"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {confirmAction === "approve"
                ? `You are about to approve "${req.subject}". Add optional remarks below.`
                : `You are about to reject "${req.subject}". Please provide a reason (optional).`}
            </p>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks {confirmAction === "reject" ? "(reason for rejection)" : "(optional)"}</Label>
              <Textarea
                id="remarks"
                placeholder={confirmAction === "reject" ? "State the reason for rejection..." : "Add any remarks..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setConfirmAction(null); setRemarks(""); }}>
                Cancel
              </Button>
              <Button
                variant={confirmAction === "reject" ? "destructive" : "default"}
                className={confirmAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                onClick={handleConfirm}
                disabled={approve.isPending || reject.isPending}
              >
                {approve.isPending || reject.isPending
                  ? "Processing..."
                  : confirmAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="gap-2 -ml-3" onClick={() => setLocation("/requests")}>
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight">{req.subject}</h2>
            {statusBadge}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Submitted on {safeDateFormat(req.createdAt, "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        {req.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="destructive"
              onClick={() => { setConfirmAction("reject"); setRemarks(""); }}
            >
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { setConfirmAction("approve"); setRemarks(""); }}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: request details */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                <p>{TYPE_LABELS[req.type] ?? req.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap">
                  {req.description}
                </div>
              </div>
              {req.remarks && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Official Remarks</p>
                  <div className="bg-muted/30 p-4 rounded-md border-l-4 border-primary text-sm whitespace-pre-wrap">
                    {req.remarks}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Name</p>
                <p>{req.user?.firstName ?? "—"} {req.user?.lastName ?? ""}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Email</p>
                <p>{req.user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Contact</p>
                <p>{req.user?.contactNumber ?? "—"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Address</p>
                <p>{req.user?.address ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          {req.processedAt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium text-muted-foreground">Processed On</p>
                  <p>{safeDateFormat(req.processedAt, "MMM d, yyyy h:mm a")}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Decision</p>
                  {statusBadge}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
