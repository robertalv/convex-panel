import React, { useEffect, useRef, ReactNode } from 'react';

export interface DropdownShellProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  onEscape?: () => void;
}

export const DropdownShell: React.FC<DropdownShellProps> = ({
  isOpen,
  onOpenChange,
  children,
  onEscape,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (onEscape) {
          onEscape();
        } else {
          onOpenChange(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange, onEscape]);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {children}
    </div>
  );
};

