import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface ProgressTrackerProps {
  completed: number;
  total: number;
}

export function ProgressTracker({ completed, total }: ProgressTrackerProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium" data-testid="text-progress-label">
              Training Progress
            </span>
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-progress-count">
            {completed} of {total} completed
          </span>
        </div>
        <Progress value={percent} className="h-2" data-testid="progress-overall" />
        <p className="text-xs text-muted-foreground mt-1" data-testid="text-progress-percent">
          {percent}% complete
        </p>
      </CardContent>
    </Card>
  );
}
