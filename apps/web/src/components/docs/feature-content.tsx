import type React from "react";
import { CodeBlock } from "./code-block";

interface FeatureContentProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  codeExample?: string;
  subtitle?: string;
}

export function FeatureContent({
  title,
  description,
  icon: Icon,
  codeExample,
  subtitle,
}: FeatureContentProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-background-tertiary text-content-primary">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <h3 className="text-2xl font-bold text-content-primary">{title}</h3>
        </div>
        {subtitle && <p className="text-lg font-medium text-content-accent">{subtitle}</p>}
      </div>

      <p className="text-content-secondary text-lg leading-relaxed">{description}</p>

      {codeExample && (
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-content-primary uppercase tracking-wider mb-3">
            Example
          </h4>
          <CodeBlock code={codeExample} title="Example" language="typescript" />
        </div>
      )}
    </div>
  );
}









