import { useState } from "react";
import { useListAnnouncements, useDeleteAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function Announcements() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListAnnouncements({ page, limit: 10 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        toast({ title: "Announcement deleted" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Announcements</h2>
          <p className="text-muted-foreground">Broadcast messages to residents.</p>
        </div>
        <Link href="/announcements/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Announcement</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="flex-1"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        ) : !data?.data || data.data.length === 0 ? (
          <div className="col-span-full py-12 text-center border rounded-lg bg-muted/20">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No announcements</h3>
            <p className="text-muted-foreground text-sm mt-1">Create one to broadcast to the community.</p>
          </div>
        ) : (
          data.data.map((ann) => (
            <Card key={ann.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2">{ann.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {ann.category && <Badge variant="secondary">{ann.category}</Badge>}
                  <span className="text-xs text-muted-foreground">{format(new Date(ann.createdAt), "MMM d, yyyy")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{ann.content}</p>
              </CardContent>
              <CardFooter className="pt-0 justify-end gap-2">
                <Link href={`/announcements/${ann.id}/edit`}>
                  <Button variant="ghost" size="sm"><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure? This will remove the announcement for all residents.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteMutation.mutate({ id: ann.id })}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= data.total}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
