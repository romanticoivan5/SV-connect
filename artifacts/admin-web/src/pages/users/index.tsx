import { useState } from "react";
import { useListUsers, useEnableUser, useDisableUser, getListUsersQueryKey } from "@workspace/api-client-react";
import type { ListUsersRole, ListUsersStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { format } from "date-fns";
import { Users, Search, Shield, ShieldOff, MoreHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<ListUsersRole | "all">("all");
  const [status, setStatus] = useState<ListUsersStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
  });

  const enableMut = useEnableUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User enabled" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    },
  });

  const disableMut = useDisableUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User disabled" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Users</h2>
        <p className="text-muted-foreground">Manage administrators and residents.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
            <div className="flex gap-2">
              <Select value={role} onValueChange={(v) => { setRole(v as ListUsersRole | "all"); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v as ListUsersStatus | "all"); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
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
                        <Users className="h-8 w-8 mb-2 opacity-40" />
                        <p>No users found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "active" ? "outline" : "destructive"}
                          className={user.status === "active" ? "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20" : ""}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/users/${user.id}`}>
                              <DropdownMenuItem className="cursor-pointer">View Profile</DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            {user.status === "active" ? (
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => disableMut.mutate({ id: user.id })}
                                disabled={disableMut.isPending}
                              >
                                <ShieldOff className="h-4 w-4 mr-2" /> Disable User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="cursor-pointer text-green-600 focus:text-green-600"
                                onClick={() => enableMut.mutate({ id: user.id })}
                                disabled={enableMut.isPending}
                              >
                                <Shield className="h-4 w-4 mr-2" /> Enable User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
