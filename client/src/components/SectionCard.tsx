import { Link } from "wouter";
import type { TrainingSection } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";

interface SectionCardProps {
  section: TrainingSection;
  completed: boolean;
  userId: number;
}

export function SectionCard({ section, completed, userId }: SectionCardProps) {
  return (
    <Card data-testid={`card-section-${section.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{section.orderIndex}</Badge>
              <h3 className="font-medium text-sm" data-testid={`text-section-title-${section.id}`}>
                {section.title}
              </h3>
            </div>
            {section.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {section.description}
              </p>
            )}
          </div>
          {completed && (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{section.estimatedMinutes} min</span>
          </div>
          <Link href={`/training/${userId}/${section.id}`}>
            <Button
              variant={completed ? "outline" : "default"}
              size="sm"
              data-testid={`button-start-section-${section.id}`}
            >
              <PlayCircle className="mr-1 h-4 w-4" />
              {completed ? "Review" : "Start"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
