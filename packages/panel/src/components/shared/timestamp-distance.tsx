import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip } from './tooltip';
import { Info } from 'lucide-react';

interface TimestampDistanceProps {
  prefix?: string;
  date: Date;
  className?: string;
  live?: boolean;
}

export const TimestampDistance: React.FC<TimestampDistanceProps> = ({
  prefix = '',
  date,
  className = '',
  live = false,
}) => {
  const formatTime = () => {
    return formatDistanceToNow(date, {
      addSuffix: true,
    }).replace('about ', '');
  };

  const [displayTime, setDisplayTime] = React.useState(formatTime());

  React.useEffect(() => {
    if (!live) {
      setDisplayTime(formatTime());
      return;
    }

    // Update every second for live timestamps
    const interval = setInterval(() => {
      setDisplayTime(formatTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [date, live]);

  const fullDate = date.toLocaleString();

  return (
    <Tooltip content={fullDate}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--color-panel-text-secondary)',
          }}
          className={className}
        >
          {prefix ? `${prefix} ` : ''}{displayTime}
        </span>
        <Info size={12} style={{ color: 'var(--color-panel-text-secondary)', cursor: 'help' }} />
      </div>
    </Tooltip>
  );
};

