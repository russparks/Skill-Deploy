import { Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PrivacyNotice() {
  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-medium" data-testid="text-privacy-title">Privacy Notice</h3>
            <p className="text-xs text-muted-foreground">
              Your data is stored temporarily for training purposes only. All personal information
              will be automatically deleted <strong>30 days</strong> after registration.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>You can request early deletion at any time.</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
