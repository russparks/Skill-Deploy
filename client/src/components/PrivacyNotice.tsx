import { Checkbox } from "@/components/ui/checkbox";

interface PrivacyNoticeProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function PrivacyNotice({ checked, onCheckedChange }: PrivacyNoticeProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs text-gray-500 leading-relaxed">
          Your data is stored only to deliver this training and will be <strong className="text-gray-700">automatically deleted after 24 hours</strong>. Complete all modules in one session. You may request early deletion at any time.
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
