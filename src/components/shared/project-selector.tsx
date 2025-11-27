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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '2px 8px',
        borderRadius: '4px',
        userSelect: 'none',
      }}
    >
      {displayTeam && (
        <Avatar name={displayTeam.name} size={20} />
      )}
      {!displayTeam && team && (
        <Avatar name={team.name} size={20} />
      )}
      <span style={{ 
        fontSize: '12px', 
        fontWeight: 600, 
        color: '#fff',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {displayName}
      </span>
    </div>
  );
};

