import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
      <AlertCircle
        size={14}
        className="text-red-400 mt-0.5 shrink-0"
      />
      <span className="text-sm text-red-400">{error}</span>
    </div>
  );
}
