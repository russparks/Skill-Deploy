import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import type { TrainingSection, UserProgress, SectionQuestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, CheckCircle, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

function convertToEmbedUrl(url: string): string {
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return url;
}

export default function TrainingViewer() {
  const { userId, sectionId } = useParams<{ userId: string; sectionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const { data: section, isLoading: sectionLoading } = useQuery<TrainingSection>({
    queryKey: ["/api/sections", sectionId],
  });

  const { data: sections } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", userId],
  });

  const { data: questions } = useQuery<SectionQuestion[]>({
    queryKey: ["/api/sections", sectionId, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/sections/${sectionId}/questions`);
      if (!res.ok) throw new Error("Failed to load questions");
      return res.json();
    },
  });

  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizPassed(false);
  }, [sectionId]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/progress/complete", {
        userId: parseInt(userId!),
        sectionId: parseInt(sectionId!),
        quizAnswers: Object.keys(quizAnswers).length > 0 ? quizAnswers : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", userId] });

      const currentSection = sections?.find((s) => s.id === parseInt(sectionId!));
      if (currentSection?.subjectId && sections && progress) {
        const subjectSections = sections
          .filter((s) => s.subjectId === currentSection.subjectId)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const currentIdx = subjectSections.findIndex((s) => s.id === currentSection.id);
        const nextInModule = subjectSections[currentIdx + 1];

        if (nextInModule) {
          setLocation(`/training/${userId}/${nextInModule.id}`);
        } else {
          const alreadyCompleted = new Set(progress.filter((p) => p.completedAt).map((p) => p.sectionId));
          alreadyCompleted.add(parseInt(sectionId!));
          const allDone = subjectSections.every((s) => alreadyCompleted.has(s.id));
          if (allDone) {
            toast({ title: "Module complete!", description: "You've finished all sections in this module." });
          }
          setLocation(`/dashboard/${userId}`);
        }
      } else {
        setLocation(`/dashboard/${userId}`);
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

  const isCompleted = progress?.some(
    (p) => p.sectionId === section.id && p.completedAt
  );

  const hasQuestions = questions && questions.length > 0;
  const allAnswered = hasQuestions && questions.every((q) => quizAnswers[q.id] !== undefined && quizAnswers[q.id] !== null);

  const handleQuizSubmit = () => {
    if (!questions) return;

    const results = questions.map((q) => ({
      id: q.id,
      correct: quizAnswers[q.id] === q.correctAnswer,
    }));

    const correctCount = results.filter((r) => r.correct).length;
    const allWrong = correctCount === 0;

    setQuizSubmitted(true);

    if (correctCount === questions.length) {
      setQuizPassed(true);
    } else if (allWrong) {
      toast({
        title: "Both answers incorrect",
        description: "You need to review the module and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: `${correctCount}/${questions.length} correct`,
        description: "Review the incorrect answer and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetryQuiz = (fullReset: boolean) => {
    if (fullReset) {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizPassed(false);
      window.scrollTo(0, 0);
    } else {
      if (!questions) return;
      const newAnswers: Record<number, boolean | null> = {};
      for (const q of questions) {
        if (quizAnswers[q.id] === q.correctAnswer) {
          newAnswers[q.id] = quizAnswers[q.id];
        } else {
          newAnswers[q.id] = null;
        }
      }
      setQuizAnswers(newAnswers);
      setQuizSubmitted(false);
    }
  };

  const canMarkComplete = !hasQuestions || quizPassed || isCompleted;

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
                  src={convertToEmbedUrl(section.videoUrl)}
                  className="w-full h-full rounded-md"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

      {hasQuestions && !isCompleted && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Knowledge Check</h3>
            <p className="text-sm text-muted-foreground">
              Answer both questions correctly to complete this module.
            </p>

            {questions.map((q, idx) => {
              const answered = quizAnswers[q.id] !== undefined && quizAnswers[q.id] !== null;
              const isCorrect = quizSubmitted && answered && quizAnswers[q.id] === q.correctAnswer;
              const isWrong = quizSubmitted && answered && quizAnswers[q.id] !== q.correctAnswer;
              const isLocked = quizSubmitted && isCorrect;

              return (
                <div
                  key={q.id}
                  className={`rounded-lg border p-4 space-y-3 ${isCorrect ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20" : isWrong ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20" : ""}`}
                  data-testid={`quiz-question-${q.id}`}
                >
                  <p className="text-sm font-medium">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant={quizAnswers[q.id] === true ? "default" : "outline"}
                      size="sm"
                      disabled={isLocked}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: true }))}
                      data-testid={`quiz-true-${q.id}`}
                    >
                      True
                    </Button>
                    <Button
                      variant={quizAnswers[q.id] === false ? "default" : "outline"}
                      size="sm"
                      disabled={isLocked}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: false }))}
                      data-testid={`quiz-false-${q.id}`}
                    >
                      False
                    </Button>
                  </div>
                  {isCorrect && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Correct
                    </p>
                  )}
                  {isWrong && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Incorrect
                    </p>
                  )}
                </div>
              );
            })}

            {!quizSubmitted && (
              <Button
                onClick={handleQuizSubmit}
                disabled={!allAnswered}
                className="w-full"
                data-testid="button-submit-quiz"
              >
                Submit Answers
              </Button>
            )}

            {quizSubmitted && !quizPassed && (
              <div className="space-y-2">
                {questions.every((q) => quizAnswers[q.id] !== q.correctAnswer) ? (
                  <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Both answers were incorrect. Please re-read the module and try again.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Review the incorrect answer above and try again.
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    handleRetryQuiz(
                      questions.every((q) => quizAnswers[q.id] !== q.correctAnswer)
                    )
                  }
                  className="w-full"
                  data-testid="button-retry-quiz"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {questions.every((q) => quizAnswers[q.id] !== q.correctAnswer)
                    ? "Redo Module"
                    : "Retry Incorrect Answer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          canMarkComplete ? (
            <Button
              data-testid="button-complete"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Complete the knowledge check to continue
            </div>
          )
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              data-testid="button-redo-section"
              onClick={() => window.scrollTo(0, 0)}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Redo Section
            </Button>
            <Link href={`/dashboard/${userId}`}>
              <Button variant="ghost" data-testid="button-back-dashboard">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
