import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GradientBackground } from "../gradient-background";
import { IconButton } from "@/components/ui/button";
import Icon, { IconSvgElement } from "../ui/icon";

export interface ModalHeader {
  title: string;
  icon?: IconSvgElement;
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
  fullscreen?: boolean;
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
  fullscreen = false,
}: ModalProps) {
  if (!isOpen) return null;

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50">
        <GradientBackground
          className="min-h-screen h-full w-full"
          enableDragRegion={true}
        >
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20"
              aria-label="Close"
            >
              <Icon name="close" className="w-4 h-4" />
            </IconButton>
          )}

          <div
            className={cn(
              "relative z-10 h-full w-full",
              contentClassName,
            )}
          >
            {children}
          </div>
        </GradientBackground>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl animate-fade-up",
          className,
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
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20"
              aria-label="Close"
            >
              <Icon name="close" className="w-4 h-4" />
            </IconButton>
          )}

          <div
            className={cn(
              "relative z-10 h-full overflow-auto p-8",
              contentClassName,
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
