import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { TrainingUser, TrainingSection, TrainingSubject, SectionQuestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Users, BookOpen, Trash2, Plus, Edit, Zap, RefreshCw, Layers, HelpCircle, GripVertical, X, Type, AlignLeft, Image, Video } from "lucide-react";

interface ContentBlock {
  type: "header" | "text" | "image" | "video";
  value: string;
  level?: "h2" | "h3";
}

function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "header":
          const tag = b.level || "h2";
          return `<${tag}>${b.value}</${tag}>`;
        case "text":
          return `<p>${b.value}</p>`;
        case "image":
          return `<img src="${b.value}" alt="" style="max-width:100%;border-radius:8px;" />`;
        case "video":
          const videoMatch = b.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          const embedUrl = videoMatch
            ? `https://www.youtube.com/embed/${videoMatch[1]}`
            : b.value;
          return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`;
        default:
          return "";
      }
    })
    .join("\n");
}

function htmlToBlocks(html: string): ContentBlock[] {
  if (!html || html.trim() === "") return [{ type: "text", value: "" }];
  const blocks: ContentBlock[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes = doc.body.childNodes;
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "h2") blocks.push({ type: "header", value: el.textContent || "", level: "h2" });
      else if (tag === "h3") blocks.push({ type: "header", value: el.textContent || "", level: "h3" });
      else if (tag === "img") blocks.push({ type: "image", value: el.getAttribute("src") || "" });
      else if (tag === "div" && el.querySelector("iframe")) {
        const iframe = el.querySelector("iframe");
        blocks.push({ type: "video", value: iframe?.getAttribute("src") || "" });
      } else if (tag === "iframe") {
        blocks.push({ type: "video", value: el.getAttribute("src") || "" });
      } else {
        blocks.push({ type: "text", value: el.innerHTML || el.textContent || "" });
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push({ type: "text", value: node.textContent.trim() });
    }
  });
  return blocks.length > 0 ? blocks : [{ type: "text", value: "" }];
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState<TrainingSection | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<TrainingSubject | null>(null);
  const [selectedSectionForQuestions, setSelectedSectionForQuestions] = useState<TrainingSection | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([{ type: "text", value: "" }]);
  const [formOrderIndex, setFormOrderIndex] = useState(0);
  const [formSubjectId, setFormSubjectId] = useState<string>("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState(10);

  const [subjectTitle, setSubjectTitle] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectIcon, setSubjectIcon] = useState("book");
  const [subjectOrderIndex, setSubjectOrderIndex] = useState(0);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionAnswer, setNewQuestionAnswer] = useState<string>("true");

  const { data: sections, isLoading: sectionsLoading } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: subjects } = useQuery<TrainingSubject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<TrainingUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: sectionQuestions } = useQuery<SectionQuestion[]>({
    queryKey: ["/api/sections", selectedSectionForQuestions?.id?.toString(), "questions"],
    queryFn: async () => {
      if (!selectedSectionForQuestions) return [];
      const res = await fetch(`/api/sections/${selectedSectionForQuestions.id}/questions`);
      return res.json();
    },
    enabled: !!selectedSectionForQuestions,
  });

  const createSectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sections", {
        title: formTitle,
        description: formDescription || null,
        content: blocksToHtml(formBlocks),
        orderIndex: formOrderIndex,
        subjectId: formSubjectId ? parseInt(formSubjectId) : null,
        videoUrl: formVideoUrl || null,
        estimatedMinutes: formEstimatedMinutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section created" });
      setSectionDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async () => {
      if (!editingSection) return;
      await apiRequest("PUT", `/api/sections/${editingSection.id}`, {
        title: formTitle,
        description: formDescription || null,
        content: blocksToHtml(formBlocks),
        orderIndex: formOrderIndex,
        subjectId: formSubjectId ? parseInt(formSubjectId) : null,
        videoUrl: formVideoUrl || null,
        estimatedMinutes: formEstimatedMinutes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section updated" });
      setEditingSection(null);
      setSectionDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: "Section deleted" });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      const method = editingSubject ? "PUT" : "POST";
      const url = editingSubject ? `/api/subjects/${editingSubject.id}` : "/api/subjects";
      await apiRequest(method, url, {
        title: subjectTitle,
        description: subjectDescription || null,
        icon: subjectIcon,
        orderIndex: subjectOrderIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: editingSubject ? "Subject updated" : "Subject created" });
      setSubjectDialogOpen(false);
      setEditingSubject(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject deleted" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSectionForQuestions) return;
      await apiRequest("POST", `/api/sections/${selectedSectionForQuestions.id}/questions`, {
        questionText: newQuestionText,
        correctAnswer: newQuestionAnswer === "true",
        orderIndex: (sectionQuestions?.length || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections", selectedSectionForQuestions?.id?.toString(), "questions"] });
      toast({ title: "Question added" });
      setNewQuestionText("");
      setNewQuestionAnswer("true");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections", selectedSectionForQuestions?.id?.toString(), "questions"] });
      toast({ title: "Question deleted" });
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
    onError: (e: Error) => toast({ title: "Error deleting user", description: e.message, variant: "destructive" }),
  });

  function openCreateSection() {
    setEditingSection(null);
    setFormTitle("");
    setFormDescription("");
    setFormBlocks([{ type: "text", value: "" }]);
    setFormOrderIndex(sections?.length || 0);
    setFormSubjectId("");
    setFormVideoUrl("");
    setFormEstimatedMinutes(10);
    setSectionDialogOpen(true);
  }

  function openEditSection(section: TrainingSection) {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormDescription(section.description || "");
    setFormBlocks(htmlToBlocks(section.content));
    setFormOrderIndex(section.orderIndex);
    setFormSubjectId(section.subjectId?.toString() || "");
    setFormVideoUrl(section.videoUrl || "");
    setFormEstimatedMinutes(section.estimatedMinutes || 10);
    setSectionDialogOpen(true);
  }

  function openCreateSubject() {
    setEditingSubject(null);
    setSubjectTitle("");
    setSubjectDescription("");
    setSubjectIcon("book");
    setSubjectOrderIndex(subjects?.length || 0);
    setSubjectDialogOpen(true);
  }

  function openEditSubject(subject: TrainingSubject) {
    setEditingSubject(subject);
    setSubjectTitle(subject.title);
    setSubjectDescription(subject.description || "");
    setSubjectIcon(subject.icon);
    setSubjectOrderIndex(subject.orderIndex);
    setSubjectDialogOpen(true);
  }

  function addBlock(type: ContentBlock["type"]) {
    setFormBlocks([...formBlocks, { type, value: "", level: type === "header" ? "h2" : undefined }]);
  }

  function updateBlock(index: number, updates: Partial<ContentBlock>) {
    const newBlocks = [...formBlocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setFormBlocks(newBlocks);
  }

  function removeBlock(index: number) {
    if (formBlocks.length <= 1) return;
    setFormBlocks(formBlocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formBlocks.length) return;
    const newBlocks = [...formBlocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setFormBlocks(newBlocks);
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
            <Zap className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="subjects" data-testid="tab-subjects">
            <Layers className="mr-2 h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="sections" data-testid="tab-sections">
            <BookOpen className="mr-2 h-4 w-4" />
            Modules
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

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Training Subjects</h2>
            <Button onClick={openCreateSubject} data-testid="button-create-subject">
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>

          <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Create Subject"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={subjectTitle} onChange={(e) => setSubjectTitle(e.target.value)} data-testid="input-subject-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input value={subjectDescription} onChange={(e) => setSubjectDescription(e.target.value)} data-testid="input-subject-description" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Icon</label>
                    <Select value={subjectIcon} onValueChange={setSubjectIcon}>
                      <SelectTrigger data-testid="select-subject-icon"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="shield-check">Shield Check</SelectItem>
                        <SelectItem value="book">Book</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Order</label>
                    <Input type="number" value={subjectOrderIndex} onChange={(e) => setSubjectOrderIndex(parseInt(e.target.value) || 0)} data-testid="input-subject-order" />
                  </div>
                </div>
                <Button className="w-full" onClick={() => createSubjectMutation.mutate()} disabled={createSubjectMutation.isPending} data-testid="button-save-subject">
                  {editingSubject ? "Update Subject" : "Create Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {subjects?.map((subject) => (
              <Card key={subject.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{subject.orderIndex}</Badge>
                        <h3 className="font-medium" data-testid={`text-admin-subject-${subject.id}`}>{subject.title}</h3>
                      </div>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-1">{subject.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditSubject(subject)} data-testid={`button-edit-subject-${subject.id}`}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteSubjectMutation.mutate(subject.id)} data-testid={`button-delete-subject-${subject.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Training Modules</h2>
            <Button onClick={openCreateSection} data-testid="button-create-section">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>

          <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSection ? "Edit Module" : "Create Module"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} data-testid="input-section-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} data-testid="input-section-description" />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                    <SelectTrigger data-testid="select-section-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => addBlock("header")} data-testid="button-add-header">
                      <Type className="mr-1 h-3 w-3" /> Header
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addBlock("text")} data-testid="button-add-text">
                      <AlignLeft className="mr-1 h-3 w-3" /> Text
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addBlock("image")} data-testid="button-add-image">
                      <Image className="mr-1 h-3 w-3" /> Image
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => addBlock("video")} data-testid="button-add-video">
                      <Video className="mr-1 h-3 w-3" /> Video
                    </Button>
                  </div>

                  {formBlocks.map((block, idx) => (
                    <div key={idx} className="flex gap-2 items-start border rounded-lg p-2">
                      <div className="flex flex-col gap-1 pt-1">
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(idx, "up")} disabled={idx === 0}>
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{block.type}</Badge>
                          {block.type === "header" && (
                            <Select value={block.level || "h2"} onValueChange={(v) => updateBlock(idx, { level: v as "h2" | "h3" })}>
                              <SelectTrigger className="h-6 w-16 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="h2">H2</SelectItem>
                                <SelectItem value="h3">H3</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        {block.type === "text" ? (
                          <Textarea
                            value={block.value}
                            onChange={(e) => updateBlock(idx, { value: e.target.value })}
                            className="min-h-[60px] text-sm"
                            placeholder="Enter text content..."
                          />
                        ) : (
                          <Input
                            value={block.value}
                            onChange={(e) => updateBlock(idx, { value: e.target.value })}
                            placeholder={
                              block.type === "header" ? "Heading text..." :
                              block.type === "image" ? "Image URL..." :
                              "YouTube URL or embed URL..."
                            }
                            className="text-sm"
                          />
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeBlock(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Order</label>
                    <Input type="number" value={formOrderIndex} onChange={(e) => setFormOrderIndex(parseInt(e.target.value) || 0)} data-testid="input-section-order" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Minutes</label>
                    <Input type="number" value={formEstimatedMinutes} onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value) || 10)} data-testid="input-section-minutes" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Video URL (optional, shown above content)</label>
                  <Input value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} placeholder="YouTube URL..." data-testid="input-section-video" />
                </div>
                <Button
                  className="w-full"
                  data-testid="button-save-section"
                  disabled={createSectionMutation.isPending || updateSectionMutation.isPending}
                  onClick={() => editingSection ? updateSectionMutation.mutate() : createSectionMutation.mutate()}
                >
                  {editingSection ? "Update Module" : "Create Module"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Questions: {selectedSectionForQuestions?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {sectionQuestions?.map((q) => (
                  <div key={q.id} className="flex items-start gap-2 border rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-sm">{q.questionText}</p>
                      <Badge variant={q.correctAnswer ? "default" : "secondary"} className="mt-1 text-xs">
                        Answer: {q.correctAnswer ? "True" : "False"}
                      </Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteQuestionMutation.mutate(q.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <label className="text-sm font-medium">Add Question</label>
                  <Textarea
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Enter question text..."
                    className="min-h-[60px]"
                    data-testid="input-question-text"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Correct answer:</label>
                    <Select value={newQuestionAnswer} onValueChange={setNewQuestionAnswer}>
                      <SelectTrigger className="w-24" data-testid="select-question-answer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createQuestionMutation.mutate()}
                    disabled={!newQuestionText || createQuestionMutation.isPending}
                    data-testid="button-add-question"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Question
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {sectionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {sections?.map((section) => {
                const subject = subjects?.find((s) => s.id === section.subjectId);
                return (
                  <Card key={section.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{section.orderIndex}</Badge>
                            <h3 className="font-medium" data-testid={`text-admin-section-${section.id}`}>
                              {section.title}
                            </h3>
                            {subject && <Badge variant="outline" className="text-xs">{subject.title}</Badge>}
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
                            title="Questions"
                            data-testid={`button-questions-section-${section.id}`}
                            onClick={() => { setSelectedSectionForQuestions(section); setQuestionDialogOpen(true); }}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-section-${section.id}`} onClick={() => openEditSection(section)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-section-${section.id}`} onClick={() => deleteSectionMutation.mutate(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                          Deletion: {u.scheduledDeletionAt ? new Date(u.scheduledDeletionAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        data-testid={`button-delete-user-${u.id}`}
                        onClick={() => deleteUserMutation.mutate(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
                The system automatically runs daily cleanup at midnight to remove expired user data (24-hour retention).
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
