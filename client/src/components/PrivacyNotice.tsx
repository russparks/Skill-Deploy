import { AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PrivacyNoticeProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function PrivacyNotice({ checked, onCheckedChange }: PrivacyNoticeProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Your data will be automatically deleted 24 hours after registration.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
              Do not start unless you have time to complete all modules in one sitting.
            </p>
            <p className="text-xs text-muted-foreground">
              We store your name, email, and organisation solely to deliver training and certificates. You may request early deletion at any time.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          id="privacy-consent"
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(val === true)}
          data-testid="checkbox-privacy-consent"
        />
        <label
          htmlFor="privacy-consent"
          className="text-sm text-muted-foreground cursor-pointer leading-snug"
        >
          I understand and accept the data retention policy
        </label>
      </div>
    </div>
  );
}
