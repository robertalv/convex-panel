import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Singleton for external access (like sonner's toast())
let globalAddToast: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export const toast = {
  success: (message: string, duration?: number) => globalAddToast?.('success', message, duration),
  error: (message: string, duration?: number) => globalAddToast?.('error', message, duration),
  info: (message: string, duration?: number) => globalAddToast?.('info', message, duration),
  warning: (message: string, duration?: number) => globalAddToast?.('warning', message, duration),
};

const getIcon = (type: ToastType) => {
  const iconProps = { size: 18, strokeWidth: 2 };
  switch (type) {
    case 'success': return <CheckCircle {...iconProps} />;
    case 'error': return <AlertCircle {...iconProps} />;
    case 'warning': return <AlertTriangle {...iconProps} />;
    default: return <Info {...iconProps} />;
  }
};

const getTypeStyles = (type: ToastType): React.CSSProperties => {
  const base = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', color: '#10b981' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', color: '#ef4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', color: '#f59e0b' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', color: '#3b82f6' },
  };
  const style = base[type];
  return { backgroundColor: style.bg, borderColor: style.border, color: style.color };
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast: t, onDismiss }) => {
  const typeStyles = getTypeStyles(t.type);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), t.duration || 4000);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
        maxWidth: '400px',
        animation: 'cp-toast-slide-in 0.2s ease-out',
        ...typeStyles,
      }}
    >
      <span style={{ flexShrink: 0 }}>{getIcon(t.type)}</span>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
          color: 'inherit', opacity: 0.7, display: 'flex', alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, position = 'bottom-right' }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  const positionStyles: React.CSSProperties = {
    position: 'fixed', zIndex: 999999, display: 'flex', flexDirection: 'column', gap: '8px',
    ...(position.includes('top') ? { top: '16px' } : { bottom: '16px' }),
    ...(position.includes('right') ? { right: '16px' } : { left: '16px' }),
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={positionStyles} className="cp-toast-container">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
      </div>
      <style>{`
        @keyframes cp-toast-slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

