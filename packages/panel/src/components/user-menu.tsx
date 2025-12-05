import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useProfile } from '../hooks/useProfile';
import { usePortalTarget } from '../contexts/portal-context';
import { useThemeSafe } from '../hooks/useTheme';
import { buildDashboardUrl } from '../utils/dashboard-urls';

export interface UserMenuProps {
  accessToken?: string;
  teamSlug?: string;
  projectSlug?: string;
  onLogout?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  accessToken,
  teamSlug,
  projectSlug,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { profile, isLoading } = useProfile(accessToken);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both menu and trigger
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use click instead of mousedown to avoid conflicts with button clicks
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true);
      }, 100);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  // Calculate menu position
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setMenuPosition(null);
    }
  }, [isOpen]);

  if (!accessToken || isLoading) {
    return null;
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    // Small delay to ensure menu closes before logout
    setTimeout(() => {
      onLogout?.();
    }, 100);
  };

  const dashboardUrl = buildDashboardUrl(teamSlug, projectSlug, accessToken);
  const profileName = profile?.email?.split('@')[0] || 'User';
  const initials = profileName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  if (!isOpen || !menuPosition || !portalTarget) {
    return (
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cp-user-menu-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary, #3b82f6)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title={profile?.email || 'User menu'}
      >
        {initials}
      </button>
    );
  }

  const menuContent = (
    <div
      ref={menuRef}
      className={`cp-user-menu cp-theme-${theme}`}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        minWidth: '200px',
        backgroundColor: 'var(--color-panel-bg-secondary)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px var(--color-panel-shadow)',
        zIndex: 100002,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        animation: 'popupSlideIn 0.2s ease-out',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        // Prevent clicks inside menu from closing it
        e.stopPropagation();
      }}
    >
      {/* User Info */}
      {profile && (
        <div
          style={{
            padding: '12px',
            borderBottom: '1px solid var(--color-panel-border)',
            marginBottom: '4px',
          }}
        >
          {profile.email && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
              }}
            >
              {profileName}
            </div>
          )}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {profile.email}
          </div>
        </div>
      )}

      {/* Dashboard Link */}
      {dashboardUrl && dashboardUrl !== 'https://dashboard.convex.dev' && (
        <>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Settings size={14} />
            Dashboard
          </a>
          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--color-panel-border)',
              margin: '4px 0',
            }}
          />
        </>
      )}

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          background: 'none',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'background-color 0.2s',
          zIndex: 1,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <LogOut size={14} />
        Log Out
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cp-user-menu-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary, #3b82f6)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title={profile?.email || 'User menu'}
      >
        {initials}
      </button>
      {isOpen && portalTarget && createPortal(menuContent, portalTarget)}
    </>
  );
};

