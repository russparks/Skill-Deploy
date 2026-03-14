import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import type { TrainingUser, TrainingSection, TrainingSubject, UserProgress } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/SectionCard";
import { Award, CheckCircle, Database, ShieldCheck, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import gmiLogoSmall from "@assets/gmi-logo-small_1773449697214.png";

const subjectIcons: Record<string, typeof Database> = {
  database: Database,
  "shield-check": ShieldCheck,
  book: BookOpen,
};

export default function Dashboard() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const [expandedSubject, setExpandedSubject] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(`expandedSubject-${userId}`);
    if (!stored) return null;
    const parsed = parseInt(stored);
    return isNaN(parsed) ? null : parsed;
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(`expandedSubject-${userId}`);
    if (stored) {
      const parsed = parseInt(stored);
      setExpandedSubject(isNaN(parsed) ? null : parsed);
    } else {
      setExpandedSubject(null);
    }
  }, [userId]);

  const { data: user, isLoading: userLoading } = useQuery<TrainingUser>({
    queryKey: ["/api/users", userId],
  });

  const { data: subjects } = useQuery<TrainingSubject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", userId],
  });

  const { data: deletionStatus } = useQuery<{ hoursRemaining: number; scheduledDeletionAt: string }>({
    queryKey: ["/api/users", userId, "deletion-status"],
  });

  useEffect(() => {
    if (user?.referenceCode) {
      setLocation(`/complete/${userId}`);
    }
  }, [user, userId, setLocation]);

  const isLoading = userLoading || sectionsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const completedIds = new Set(progress?.filter((p) => p.completedAt).map((p) => p.sectionId) || []);
  const completedCount = completedIds.size;
  const totalCount = sections?.length || 0;

  const getSectionsForSubject = (subjectId: number) =>
    sections?.filter((s) => s.subjectId === subjectId) || [];

  const getSubjectProgress = (subjectId: number) => {
    const subjectSections = getSectionsForSubject(subjectId);
    const completed = subjectSections.filter((s) => completedIds.has(s.id)).length;
    return { completed, total: subjectSections.length };
  };

  const ungroupedSections = sections?.filter((s) => !s.subjectId) || [];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-welcome">
            <img src={gmiLogoSmall} alt="GMI" className="h-8 w-8 object-contain" />
            Welcome, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.organization && `${user.organization} - `}{user.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/certificates/${userId}`}>
            <Button variant="outline" data-testid="link-certificates">
              <Award className="mr-2 h-4 w-4" />
              Certificates
            </Button>
          </Link>
        </div>
      </div>

      {/* Data warning */}
      {deletionStatus && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs text-rose-700 leading-relaxed">
            Your data will be deleted in <strong>{deletionStatus.hoursRemaining} hours</strong>. Complete all modules before then.
          </p>
        </div>
      )}

      {/* Overall progress bar */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <span data-testid="text-overall-progress">{completedCount}/{totalCount} modules complete</span>
      </div>

      {/* Subject cards */}
      {subjects && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const Icon = subjectIcons[subject.icon] || BookOpen;
            const prog = getSubjectProgress(subject.id);
            const isExpanded = expandedSubject === subject.id;
            const isSubjectComplete = prog.completed === prog.total && prog.total > 0;

            return (
              <div key={subject.id} className={isExpanded ? "md:col-span-2" : ""}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${isSubjectComplete ? "border-green-300 dark:border-green-700" : ""}`}
                  data-testid={`card-subject-${subject.id}`}
                  onClick={() => {
                    const newVal = isExpanded ? null : subject.id;
                    setExpandedSubject(newVal);
                    if (newVal !== null) {
                      sessionStorage.setItem(`expandedSubject-${userId}`, String(newVal));
                    } else {
                      sessionStorage.removeItem(`expandedSubject-${userId}`);
                    }
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${isSubjectComplete ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"}`}>
                        {isSubjectComplete ? (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold" data-testid={`text-subject-title-${subject.id}`}>
                          {subject.title}
                        </h3>
                        {subject.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subject.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isSubjectComplete ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${prog.total > 0 ? (prog.completed / prog.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{prog.completed}/{prog.total}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    {getSectionsForSubject(subject.id).map((section) => (
                      <div key={section.id}>
                        <SectionCard
                          section={section}
                          completed={completedIds.has(section.id)}
                          userId={parseInt(userId!)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ungrouped sections */}
      {ungroupedSections.length > 0 && (
        <div>
          <hr className="border-gray-200 mb-6" />
          <h2 className="text-lg font-medium mb-3">Other Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ungroupedSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                completed={completedIds.has(section.id)}
                userId={parseInt(userId!)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All complete card */}
      {completedCount === totalCount && totalCount > 0 && (
        <div>
          <hr className="border-gray-200 mb-6" />
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-all-complete">
                All Modules Complete!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                You've completed all training sections. Finish to receive your unique reference code.
              </p>
              <Link href={`/complete/${userId}`}>
                <Button size="lg" data-testid="button-finish-training">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish & Get Reference Code
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
