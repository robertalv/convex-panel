import React from 'react';
import { Team, Project } from '../../types';
import { Avatar } from './avatar';

export interface ProjectSelectorProps {
  team?: Team;
  project?: Project;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  team,
  project,
}) => {
  const displayName = project?.name || team?.name || 'Project';
  const displayTeam = project ? team : null;

  return (
    <div className="cp-project-selector">
      {displayTeam && (
        <Avatar name={displayTeam.name} size={20} />
      )}
      {!displayTeam && team && (
        <Avatar name={team.name} size={20} />
      )}
      <span className="cp-project-name">
        {displayName}
      </span>
    </div>
  );
};

