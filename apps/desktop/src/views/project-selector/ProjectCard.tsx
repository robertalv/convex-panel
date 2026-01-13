import type { Project } from "@/types/desktop";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-150 hover:border-border-strong hover:shadow-sm shadow-none"
      onClick={() => onSelect(project)}
    >
      <div className="flex items-center gap-2 p-1.5">
        <Avatar className="rounded-lg" name={project.name || "Untitled Project"} hashKey={project.id} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-text-base">
            {project.name || "Untitled Project"}
          </div>
          <div className="truncate text-xs text-text-muted">{project.slug}</div>
        </div>

        <Icon name="chevron-right" className="h-5 w-5 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Card>
  );
}
