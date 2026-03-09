import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import type { TrainingSection, UserProgress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from "lucide-react";

export default function TrainingViewer() {
  const { userId, sectionId } = useParams<{ userId: string; sectionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: section, isLoading: sectionLoading } = useQuery<TrainingSection>({
    queryKey: ["/api/sections", sectionId],
  });

  const { data: sections } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", userId],
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/progress/complete", {
        userId: parseInt(userId!),
        sectionId: parseInt(sectionId!),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });
      toast({ title: "Section completed!", description: "Great job! Moving to the next section." });

      if (sections && section) {
        const currentIndex = sections.findIndex((s) => s.id === section.id);
        if (currentIndex < sections.length - 1) {
          const nextSection = sections[currentIndex + 1];
          setTimeout(() => setLocation(`/training/${userId}/${nextSection.id}`), 1500);
        }
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (sectionLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <p className="text-muted-foreground">Section not found</p>
      </div>
    );
  }

  const currentIndex = sections?.findIndex((s) => s.id === section.id) ?? 0;
  const totalSections = sections?.length ?? 1;
  const progressPercent = ((currentIndex + 1) / totalSections) * 100;
  const prevSection = sections && currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = sections && currentIndex < totalSections - 1 ? sections[currentIndex + 1] : null;

  const isCompleted = progress?.some(
    (p) => p.sectionId === section.id && p.completedAt
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/dashboard/${userId}`}>
          <Button variant="ghost" data-testid="link-back-dashboard">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground" data-testid="text-progress-position">
          Module {currentIndex + 1} of {totalSections}
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-section-title">{section.title}</h1>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{section.estimatedMinutes} min</span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </div>
            </div>

            {section.videoUrl && (
              <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                <iframe
                  src={section.videoUrl}
                  className="w-full h-full rounded-md"
                  allowFullScreen
                  title={section.title}
                />
              </div>
            )}

            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              data-testid="content-section"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {prevSection ? (
          <Link href={`/training/${userId}/${prevSection.id}`}>
            <Button variant="outline" data-testid="button-prev-section">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {!isCompleted ? (
          <Button
            data-testid="button-complete"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        ) : nextSection ? (
          <Link href={`/training/${userId}/${nextSection.id}`}>
            <Button data-testid="button-next-section">
              Next Module
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/certificates/${userId}`}>
            <Button data-testid="button-view-certificates">
              View Certificates
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
