import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function StepNavigation({
  onNext,
  onPrev,
  nextLabel = "Continue",
  nextDisabled = false,
  showSkip = false,
  onSkip,
}: StepNavigationProps) {
  return (
    <div className="flex gap-3 justify-center pt-2">
      <Button variant="ghost" onClick={onPrev}>
        <ArrowLeft size={16} className="mr-2" />
        Back
      </Button>
      {showSkip && onSkip && (
        <Button variant="ghost" onClick={onSkip} className="text-text-muted">
          Skip for now
        </Button>
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight size={16} className="ml-2" />
      </Button>
    </div>
  );
}
