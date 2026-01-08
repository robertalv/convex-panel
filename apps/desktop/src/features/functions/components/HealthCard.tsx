import React from "react";
import { Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthCardProps {
  title: string;
  tip: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  title,
  tip,
  loading,
  error,
  children,
  action,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-3">
          {action}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-text-muted hover:text-text-base transition-colors">
                <Info size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{tip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[100px] flex items-center justify-center text-text-muted text-xs">
            Loading...
          </div>
        ) : error ? (
          <div className="h-[100px] flex items-center justify-center text-red-500 text-xs">
            {error}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};
