import { Cross2Icon } from "@radix-ui/react-icons";
import { forwardRef } from "react";
import { IconButton } from "@/components/ui/button";

export const ClosePanelButton = forwardRef<
  HTMLButtonElement,
  {
    onClose: () => void;
    className?: string;
  }
>(function ClosePanelButton({ onClose, className }, ref) {
  return (
    <IconButton
      ref={ref}
      onClick={onClose}
      aria-label="Close panel"
      data-testid="close-panel-button"
      className={className}
      variant="ghost"
      size="xs"
    >
      <Cross2Icon aria-hidden="true" />
    </IconButton>
  );
});
