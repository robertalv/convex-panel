import React from 'react';
import { X, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';

export interface OAuthErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  errors: string[];
  warnings?: string[];
}

export const OAuthErrorPopup: React.FC<OAuthErrorPopupProps> = ({
  isOpen,
  onClose,
  onContinue,
  errors,
  warnings = [],
}) => {
  if (!isOpen) return null;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div
      className="cp-oauth-error-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
    >
      <div
        className="cp-oauth-error-popup"
        style={{
          backgroundColor: 'var(--cp-bg-primary, #1a1a1a)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--cp-border, #333)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {hasErrors ? (
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            ) : (
              <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
            )}
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--cp-text-primary, #fff)',
              }}
            >
              {hasErrors ? 'Configuration Error' : 'Configuration Warning'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cp-text-secondary, #888)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--cp-bg-secondary, #2a2a2a)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div style={{ marginBottom: warnings.length > 0 ? '20px' : '0' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ef4444',
              }}
            >
              Please fix the following issues:
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: 'var(--cp-text-primary, #fff)',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {errors.map((error, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#f59e0b',
              }}
            >
              Warnings:
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: 'var(--cp-text-primary, #fff)',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {warnings.map((warning, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Helpful links */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--cp-border, #333)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              color: 'var(--cp-text-secondary, #888)',
            }}
          >
            Need help? Check these resources:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href="https://convexpanel.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              <ExternalLink size={14} />
              Documentation
            </a>
            <a
              href="https://api.convexpanel.dev/health"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              <ExternalLink size={14} />
              Check API Server Status
            </a>
          </div>
        </div>

        {/* Close button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {!hasErrors && hasWarnings && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--cp-text-secondary, #888)',
                border: '1px solid var(--cp-border, #333)',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--cp-bg-secondary, #2a2a2a)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (hasErrors) {
                onClose();
              } else if (hasWarnings && onContinue) {
                onContinue();
              } else {
                onClose();
              }
            }}
            style={{
              backgroundColor: hasErrors ? '#ef4444' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hasErrors ? '#dc2626' : '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = hasErrors ? '#ef4444' : '#3b82f6';
            }}
          >
            {hasErrors ? 'Close' : hasWarnings ? 'Continue' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

