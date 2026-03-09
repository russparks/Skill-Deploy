import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { TrainingUser, TrainingSection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Users, BookOpen, Trash2, Plus, Edit, Shield, RefreshCw } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<TrainingSection | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formOrderIndex, setFormOrderIndex] = useState(0);
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState(10);

  const { data: sections, isLoading: sectionsLoading } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<TrainingUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sections", {
        title: formTitle,
        description: formDescription || null,
        content: formContent,
        orderIndex: formOrderIndex,
        videoUrl: formVideoUrl || null,
        estimatedMinutes: formEstimatedMinutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section created" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingSection) return;
      await apiRequest("PUT", `/api/sections/${editingSection.id}`, {
        title: formTitle,
        description: formDescription || null,
        content: formContent,
        orderIndex: formOrderIndex,
        videoUrl: formVideoUrl || null,
        estimatedMinutes: formEstimatedMinutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section updated" });
      resetForm();
      setEditingSection(null);
      setDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section deleted" });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cleanup/run");
      return res.json();
    },
    onSuccess: (data: { deletedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Cleanup complete", description: `Deleted ${data.deletedCount} expired user(s).` });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}/data`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User data deleted" });
    },
  });

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormContent("");
    setFormOrderIndex(sections?.length ? sections.length + 1 : 1);
    setFormVideoUrl("");
    setFormEstimatedMinutes(10);
  }

  function openCreate() {
    setEditingSection(null);
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(section: TrainingSection) {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormDescription(section.description || "");
    setFormContent(section.content);
    setFormOrderIndex(section.orderIndex);
    setFormVideoUrl(section.videoUrl || "");
    setFormEstimatedMinutes(section.estimatedMinutes || 10);
    setDialogOpen(true);
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold" data-testid="text-admin-title">Admin Panel</h1>
        </div>
        <Link href="/">
          <Button variant="outline" data-testid="link-home">
            <Shield className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections" data-testid="tab-sections">
            <BookOpen className="mr-2 h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="cleanup" data-testid="tab-cleanup">
            <RefreshCw className="mr-2 h-4 w-4" />
            Cleanup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Training Sections</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} data-testid="button-create-section">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSection ? "Edit Section" : "Create Section"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      data-testid="input-section-title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      data-testid="input-section-description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content (HTML)</label>
                    <Textarea
                      data-testid="input-section-content"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Order</label>
                      <Input
                        data-testid="input-section-order"
                        type="number"
                        value={formOrderIndex}
                        onChange={(e) => setFormOrderIndex(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Minutes</label>
                      <Input
                        data-testid="input-section-minutes"
                        type="number"
                        value={formEstimatedMinutes}
                        onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Video URL (optional)</label>
                    <Input
                      data-testid="input-section-video"
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    data-testid="button-save-section"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    onClick={() => editingSection ? updateMutation.mutate() : createMutation.mutate()}
                  >
                    {editingSection ? "Update Section" : "Create Section"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sectionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {sections?.map((section) => (
                <Card key={section.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{section.orderIndex}</Badge>
                          <h3 className="font-medium" data-testid={`text-admin-section-${section.id}`}>
                            {section.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {section.estimatedMinutes} min
                          {section.description && ` - ${section.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-edit-section-${section.id}`}
                          onClick={() => openEdit(section)}
                        >
                          <Edit />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-delete-section-${section.id}`}
                          onClick={() => deleteMutation.mutate(section.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-lg font-medium">Registered Users</h2>
          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : users?.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No registered users yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {users?.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium" data-testid={`text-user-${u.id}`}>{u.name}</h3>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Deletion: {u.scheduledDeletionAt ? new Date(u.scheduledDeletionAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-user-${u.id}`}
                        onClick={() => deleteUserMutation.mutate(u.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Cleanup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The system automatically runs daily cleanup at midnight to remove expired user data.
                You can also trigger a manual cleanup below.
              </p>
              <Button
                data-testid="button-run-cleanup"
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {cleanupMutation.isPending ? "Running..." : "Run Cleanup Now"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
