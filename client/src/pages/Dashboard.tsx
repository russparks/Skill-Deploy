import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { TrainingUser, TrainingSection, UserProgress } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteCountdown } from "@/components/DeleteCountdown";
import { ProgressTracker } from "@/components/ProgressTracker";
import { SectionCard } from "@/components/SectionCard";
import { Shield, Award, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { userId } = useParams<{ userId: string }>();

  const { data: user, isLoading: userLoading } = useQuery<TrainingUser>({
    queryKey: ["/api/users", userId],
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress", userId],
  });

  const { data: deletionStatus } = useQuery<{ daysRemaining: number; scheduledDeletionAt: string }>({
    queryKey: ["/api/users", userId, "deletion-status"],
  });

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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-welcome">
            <Shield className="h-6 w-6 text-primary" />
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

      {deletionStatus && (
        <DeleteCountdown
          daysRemaining={deletionStatus.daysRemaining}
          scheduledDeletionAt={deletionStatus.scheduledDeletionAt}
        />
      )}

      <ProgressTracker completed={completedCount} total={totalCount} />

      <div>
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          Training Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections?.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              completed={completedIds.has(section.id)}
              userId={parseInt(userId!)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
