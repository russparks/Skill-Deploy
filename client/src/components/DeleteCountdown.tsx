import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

interface DeleteCountdownProps {
  daysRemaining: number;
  scheduledDeletionAt: string;
}

export function DeleteCountdown({ daysRemaining, scheduledDeletionAt }: DeleteCountdownProps) {
  const isUrgent = daysRemaining <= 7;
  const deletionDate = new Date(scheduledDeletionAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className={isUrgent ? "border-destructive/30 bg-destructive/5 dark:bg-destructive/10" : "border-primary/20 bg-primary/5 dark:bg-primary/10"}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-medium" data-testid="text-deletion-title">
              Data Retention
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-deletion-info">
              Your data will be automatically deleted on <strong>{deletionDate}</strong>.
            </p>
            <p className="text-lg font-semibold" data-testid="text-days-remaining">
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
