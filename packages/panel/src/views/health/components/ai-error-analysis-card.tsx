import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { getRecentAnalyses, type ErrorAnalysis } from '../../../utils/api/aiAnalysis';
import { AIErrorAnalysisDetailSheet } from './ai-error-analysis-detail-sheet';
import { getSeverityColor } from '../../../utils';
import { formatRelativeTime } from '../../../utils/cronFormatters';

export const AIErrorAnalysisCard: React.FC<{
  adminClient?: any;
  container?: HTMLElement | null;
}> = ({ adminClient, container }) => {
  const [analyses, setAnalyses] = useState<ErrorAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ErrorAnalysis | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  useEffect(() => {
    if (!adminClient) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecentAnalyses(adminClient, { limit: 5 });
        if (mounted) {
          setAnalyses(data);
          setCurrentIndex(0);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch AI analyses');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [adminClient]);

  if (!adminClient) {
    return null;
  }

  const currentAnalysis = analyses.length > 0 ? analyses[currentIndex] : null;

  return (
    <Card
      title="AI Error Analysis"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {analyses.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : analyses.length - 1));
                }}
                style={{
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-panel-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Previous analysis"
              >
                <ArrowLeft size={14} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
                {currentIndex + 1} / {analyses.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev < analyses.length - 1 ? prev + 1 : 0));
                }}
                style={{
                  padding: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-panel-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text)';
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Next analysis"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '11px', 
              color: 'var(--color-panel-text-muted)',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              borderRadius: '8px',
              padding: '2px 6px',
            }}
          >
            Powered by AI
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-panel-accent)' }} />
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-panel-text-muted)', fontWeight: 500 }}>
              Analyzing errors...
            </div>
          </div>
        )}
        {!loading && error && (
          <div style={{ 
            padding: '12px', 
            color: 'var(--color-panel-error)', 
            fontSize: '12px',
            backgroundColor: 'var(--color-background-error)',
            borderRadius: '6px',
            border: '1px solid var(--color-border-error)',
          }}>
            {error}
          </div>
        )}
        {!loading && !error && analyses.length === 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
              No AI analyses available
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', lineHeight: '1.5', maxWidth: '240px' }}>
              Configure AI Analysis in Settings, or manually trigger analysis from the Logs view.
            </div>
          </div>
        )}
        {!loading && !error && currentAnalysis && (
          <div
            onClick={() => {
              setSelectedAnalysis(currentAnalysis);
              setIsDetailSheetOpen(true);
            }}
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-panel-bg-tertiary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            }}
          >
            {/* Severity Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  backgroundColor: getSeverityColor(currentAnalysis.severity).bg,
                  border: `1px solid ${getSeverityColor(currentAnalysis.severity).badge}`,
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                <AlertCircle size={10} />
                {currentAnalysis.severity}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
                {(currentAnalysis as any)._creationTime && (
                  <>
                    <Clock size={12} />
                    <span>{formatRelativeTime((currentAnalysis as any)._creationTime)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Root Cause */}
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--color-panel-text-secondary)', 
              lineHeight: '1.5',
              marginBottom: '12px',
            }}>
              {currentAnalysis.rootCause}
            </div>

            {/* Metadata */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-panel-border)',
              fontSize: '11px',
              color: 'var(--color-panel-text-muted)',
            }}>
              <span>Confidence: {Math.round(currentAnalysis.confidence * 100)}%</span>
              {currentAnalysis.suggestions.length > 0 && (
                <span>{currentAnalysis.suggestions.length} suggestion{currentAnalysis.suggestions.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <AIErrorAnalysisDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedAnalysis(null);
        }}
        analysis={selectedAnalysis}
        container={container}
      />
    </Card>
  );
};
