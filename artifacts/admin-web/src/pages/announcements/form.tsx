import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateAnnouncement, useUpdateAnnouncement, useGetAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AnnouncementForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const annId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ann, isLoading } = useGetAnnouncement(annId, { query: { enabled: isEditing } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    }
  });

  useEffect(() => {
    if (ann && isEditing) {
      form.reset({
        title: ann.title,
        content: ann.content,
        category: ann.category || "",
      });
    }
  }, [ann, isEditing, form]);

  const createMut = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        toast({ title: "Announcement created" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setLocation("/announcements");
      }
    }
  });

  const updateMut = useUpdateAnnouncement({
    mutation: {
      onSuccess: () => {
        toast({ title: "Announcement updated" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setLocation("/announcements");
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateMut.mutate({ id: annId, data: values });
    } else {
      createMut.mutate({ data: values });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  if (isEditing && isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-[200px]" /><Skeleton className="h-[400px] w-full" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" className="gap-2 -ml-3" onClick={() => setLocation("/announcements")}>
        <ArrowLeft className="h-4 w-4" /> Back to Announcements
      </Button>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {isEditing ? "Edit Announcement" : "Create Announcement"}
        </h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="health">Health & Medical</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type announcement details here..." className="min-h-[200px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLocation("/announcements")}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Announcement"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
