import { useState } from "react";
import { useListRequests } from "@workspace/api-client-react";
import type { ListRequestsStatus, ListRequestsType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_LABELS: Record<string, string> = {
  barangay_clearance: "Barangay Clearance",
  certificate_of_residency: "Certificate of Residency",
  business_permit: "Business Permit",
  complaint: "Complaint",
  community_concern: "Community Concern",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export default function Requests() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListRequestsStatus | "all">("all");
  const [type, setType] = useState<ListRequestsType | "all">("all");

  const { data, isLoading } = useListRequests({
    page,
    limit: 10,
    search: search || undefined,
    status: status === "all" ? undefined : status,
    type: type === "all" ? undefined : type,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Requests</h2>
        <p className="text-muted-foreground">Manage and process resident requests.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="absolute right-2.5 top-2.5" onClick={() => { setSearch(""); setPage(1); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={status} onValueChange={(v) => { setStatus(v as ListRequestsStatus | "all"); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={(v) => { setType(v as ListRequestsType | "all"); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="barangay_clearance">Barangay Clearance</SelectItem>
                  <SelectItem value="certificate_of_residency">Certificate of Residency</SelectItem>
                  <SelectItem value="business_permit">Business Permit</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="community_concern">Community Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.data?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-40" />
                        <p>No requests found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{req.subject}</TableCell>
                      <TableCell>{TYPE_LABELS[req.type] ?? req.type}</TableCell>
                      <TableCell>{req.user?.firstName} {req.user?.lastName}</TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(req.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[req.status] ?? "default"}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/requests/${req.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.total}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
