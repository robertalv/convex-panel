import type { CSSProperties } from 'react';

export const PANEL_HEADER_HEIGHT = 40;
export const PANEL_SIDEBAR_WIDTH = 48;

interface BottomSheetStyles {
  rootBase: CSSProperties;
  headerBase: CSSProperties;
  headerSection: CSSProperties;
  supportButton: CSSProperties;
  supportButtonHover: CSSProperties;
  iconButton: CSSProperties;
  iconButtonHover: CSSProperties;
  connectButton: CSSProperties;
  connectButtonHover: CSSProperties;
  resizeHandle: CSSProperties;
  sidebarItemWrapper: CSSProperties;
  sidebarButtonBase: CSSProperties;
  sidebarButtonActive: CSSProperties;
  sidebarButtonHover: CSSProperties;
  tooltip: CSSProperties;
  sidebarContainer: CSSProperties;
  separator: CSSProperties;
  mainContent: CSSProperties;
  floatingButtonWrapper: CSSProperties;
  floatingButton: CSSProperties;
  floatingButtonHover: CSSProperties;
}

export const bottomSheetStyles: BottomSheetStyles = {
  rootBase: {
    contain: 'style layout paint',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#fff',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F1115',
    borderTop: '1px solid #2D313A',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 99998,
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.3)',
    borderLeft: 'none',
    borderRight: 'none',
    pointerEvents: 'auto',
    margin: 0,
    padding: 0,
    outline: 'none',
  },
  headerBase: {
    height: `${PANEL_HEADER_HEIGHT}px`,
    minHeight: `${PANEL_HEADER_HEIGHT}px`,
    borderBottom: '1px solid #2D313A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    backgroundColor: '#16181D',
    flexShrink: 0,
  },
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  supportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#999',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  supportButtonHover: {
    color: '#fff',
  },
  iconButton: {
    padding: '4px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    color: '#999',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHover: {
    backgroundColor: '#2D313A',
    color: '#fff',
  },
  connectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '8px',
    backgroundColor: '#5B46DF',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  connectButtonHover: {
    backgroundColor: '#4d3bc2',
  },
  resizeHandle: {
    height: '8px',
    cursor: 'ns-resize',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  sidebarItemWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  sidebarButtonBase: {
    width: '25px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#999',
  },
  sidebarButtonActive: {
    backgroundColor: '#1C1F26',
    color: '#fff',
  },
  sidebarButtonHover: {
    color: '#d1d5db',
    backgroundColor: 'rgba(28, 31, 38, 0.5)',
  },
  tooltip: {
    position: 'absolute',
    left: '48px',
    padding: '4px 8px',
    backgroundColor: '#2D313A',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '4px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 50,
  },
  sidebarContainer: {
    width: `${PANEL_SIDEBAR_WIDTH}px`,
    borderRight: '1px solid #2D313A',
    backgroundColor: '#16181D',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
    gap: '8px',
    flexShrink: 0,
  },
  separator: {
    width: '1px',
    height: '16px',
    backgroundColor: '#2D313A',
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0F1115',
  },
  floatingButtonWrapper: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    zIndex: 10,
  },
  floatingButton: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#1C1F26',
    border: '1px solid #2D313A',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    opacity: 0.9,
  },
  floatingButtonHover: {
    backgroundColor: '#2D313A',
    opacity: 1,
    transform: 'scale(1.05)',
  },
};

interface AuthPanelStyles {
  container: CSSProperties;
  missingConfig: CSSProperties;
  missingConfigSubtext: CSSProperties;
  header: CSSProperties;
  title: CSSProperties;
  description: CSSProperties;
  errorBox: CSSProperties;
  connectCard: CSSProperties;
  cardIntro: CSSProperties;
  cardTitle: CSSProperties;
  cardList: CSSProperties;
  connectButton: CSSProperties;
  connectButtonDisabled: CSSProperties;
  connectButtonHover: CSSProperties;
  buttonIcon: CSSProperties;
  spinner: CSSProperties;
  securityCard: CSSProperties;
  securityTitle: CSSProperties;
  securityList: CSSProperties;
}

export const AUTH_PANEL_SPINNER_KEYFRAMES = `
@keyframes authPanelSpin {
  to { transform: rotate(360deg); }
}
`;

export const authPanelStyles: AuthPanelStyles = {
  container: {
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#0F1115',
    height: '100%',
    overflowY: 'auto',
  },
  missingConfig: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    backgroundColor: '#0F1115',
    height: '100%',
  },
  missingConfigSubtext: {
    fontSize: '14px',
    marginTop: '8px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  description: {
    color: '#999',
    fontSize: '14px',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  connectCard: {
    backgroundColor: '#1C1F26',
    border: '1px solid #2D313A',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardIntro: {
    marginBottom: '16px',
  },
  cardTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  cardList: {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: 1.6,
    paddingLeft: '20px',
    margin: 0,
  },
  connectButton: {
    width: '100%',
    backgroundColor: '#5B46DF',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
  },
  connectButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  connectButtonHover: {
    backgroundColor: '#4d3bc2',
  },
  buttonIcon: {
    display: 'block',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #fff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'authPanelSpin 1s linear infinite',
  },
  securityCard: {
    backgroundColor: '#1C1F26',
    border: '1px solid #2D313A',
    borderRadius: '6px',
    padding: '16px',
    fontSize: '12px',
    color: '#6b7280',
  },
  securityTitle: {
    margin: 0,
    marginBottom: '8px',
    fontWeight: 500,
    color: '#9ca3af',
  },
  securityList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: 1.6,
  },
};


