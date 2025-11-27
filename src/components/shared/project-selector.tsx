import React from 'react';

export interface Team {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  teamId: string;
}

export interface ProjectSelectorProps {
  team?: Team;
  project?: Project;
}

// Simple avatar component
const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 20 }) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 500,
        color: '#d1d5db',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

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

