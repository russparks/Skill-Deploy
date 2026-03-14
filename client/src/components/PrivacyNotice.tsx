import { Checkbox } from "@/components/ui/checkbox";

interface PrivacyNoticeProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function PrivacyNotice({ checked, onCheckedChange }: PrivacyNoticeProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
        <p className="text-xs text-rose-700 leading-relaxed">
          Data is used only to deliver this training and deleted after <span className="font-bold">24 hours</span>. Complete all modules in one session. Early deletion available on request.
        </p>
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
          className="text-sm text-gray-500 cursor-pointer leading-snug"
        >
          I understand and accept the data retention policy
        </label>
      </div>
    </div>
  );
}
