import type { Project } from "convex-panel";
import { Card } from "@/components/ui/card";
import { ChevronRight, Folder } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-150 hover:border-border-strong hover:shadow-md"
      onClick={() => onSelect(project)}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Project Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-base/10">
          <Folder className="h-5 w-5 text-brand-base" />
        </div>

        {/* Project Info */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-text-base">
            {project.name || "Untitled Project"}
          </div>
          <div className="truncate text-xs text-text-muted">{project.slug}</div>
        </div>

        {/* Arrow indicator */}
        <ChevronRight className="h-5 w-5 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Card>
  );
}
