import { FolderOpen, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FolderStepProps {
  selectedPath: string | null;
  onSelectDirectory: () => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export function FolderStep({
  selectedPath,
  onSelectDirectory,
  onNext,
  onPrev,
}: FolderStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
        <FolderOpen size={32} className="text-amber-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-base">
          Select Project Folder
        </h2>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          Choose the folder containing your{" "}
          <code className="text-text-secondary bg-surface-raised px-1 rounded">
            convex/
          </code>{" "}
          directory.
        </p>
      </div>

      {selectedPath ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-3">
              <Check
                size={18}
                className="text-green-500 shrink-0"
              />
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-text-base">
                  Folder Selected
                </p>
                <p className="text-xs text-text-muted font-mono truncate">
                  {selectedPath}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onSelectDirectory}
            className="text-sm text-brand-base hover:text-brand-hover transition-colors"
          >
            Choose a different folder
          </button>
        </div>
      ) : (
        <button
          onClick={onSelectDirectory}
          className="w-full p-5 rounded-xl border-2 border-dashed border-border-base hover:border-brand-base hover:bg-brand-base/5 transition-all group"
        >
          <FolderOpen
            size={28}
            className="mx-auto mb-2 text-text-muted group-hover:text-brand-base transition-colors"
          />
          <p className="text-sm font-medium text-text-base">
            Click to browse
          </p>
          <p className="text-xs text-text-muted mt-1">
            Select your project's root directory
          </p>
        </button>
      )}

      <div className="flex gap-3 justify-center pt-2">
        <Button variant="ghost" onClick={onPrev}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedPath}>
          Continue
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
