import { ReactNode } from "react";
import { X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradientBackground } from "./GradientBackground";
import { IconButton } from "@/components/ui/button";

interface ModalHeader {
  title: string;
  icon?: LucideIcon;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string | number;
  height?: string | number;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  width = "960px",
  height = "600px",
  className,
  contentClassName,
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl animate-fade-up",
          className
        )}
        style={{
          width: widthStyle,
          maxWidth: widthStyle,
          height: heightStyle,
          maxHeight: heightStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GradientBackground
          className="min-h-full h-full w-full"
          enableDragRegion={false}
        >
          {/* Close button */}
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </IconButton>
          )}

          {/* Content */}
          <div
            className={cn(
              "relative z-10 h-full overflow-auto p-8",
              contentClassName
            )}
          >
            <div className="w-full max-w-3xl mx-auto h-full flex items-center justify-center">
              <div className="w-full">{children}</div>
            </div>
          </div>
        </GradientBackground>
      </div>
    </div>
  );
}

export default Modal;

