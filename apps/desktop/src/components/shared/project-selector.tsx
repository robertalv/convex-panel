import React from 'react';
import type { Team, Project } from '../../types';
import { Avatar } from './avatar';

export interface ProjectSelectorProps {
  team?: Team;
  project?: Project;
  loading?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  team,
  project,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="cp-project-selector">
        {/* Avatar skeleton */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'var(--color-panel-border)',
            flexShrink: 0,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        {/* Text skeleton */}
        <div
          style={{
            width: 120,
            height: 14,
            borderRadius: 4,
            backgroundColor: 'var(--color-panel-border)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </div>
    );
  }

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

