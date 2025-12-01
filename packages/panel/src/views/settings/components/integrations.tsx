import React from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { ProBadge } from '../../../components/shared/pro-badge';

// Import integration logos
import sentryLogo from '../../../../../shared/assets/integrations/sentry-dark.webp';
import axiomLogo from '../../../../../shared/assets/integrations/axiom.webp';
import datadogLogo from '../../../../../shared/assets/integrations/dd_icon_rgb.webp';
import fivetranLogo from '../../../../../shared/assets/integrations/fivetran-blue.svg';
import airbyteLogo from '../../../../../shared/assets/integrations/airbyte.svg';

export interface IntegrationsProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

interface Integration {
  id: string;
  name: string;
  type: 'Exception Reporting' | 'Log Stream' | 'Streaming Export';
  logo: string;
  tooltip: React.ReactNode;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'sentry',
    name: 'Sentry',
    type: 'Exception Reporting',
    logo: sentryLogo,
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Sentry</div>
        <div style={{ marginBottom: '8px' }}>
          Configure and monitor logging integrations within this deployment.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Logs will be routed to your configured drains as functions are called and events occur in your deployment.
        </div>
        <div>
          This gives you full flexibility to query, store, and process logs as needed.
        </div>
      </>
    ),
  },
  {
    id: 'axiom',
    name: 'Axiom',
    type: 'Log Stream',
    logo: axiomLogo,
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Axiom</div>
        <div style={{ marginBottom: '8px' }}>
          Configure and monitor logging integrations within this deployment.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Logs will be routed to your configured drains as functions are called and events occur in your deployment.
        </div>
        <div>
          This gives you full flexibility to query, store, and process logs as needed.
        </div>
      </>
    ),
  },
  {
    id: 'datadog',
    name: 'Datadog',
    type: 'Log Stream',
    logo: datadogLogo,
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Datadog</div>
        <div style={{ marginBottom: '8px' }}>
          Configure and monitor logging integrations within this deployment.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Logs will be routed to your configured drains as functions are called and events occur in your deployment.
        </div>
        <div>
          This gives you full flexibility to query, store, and process logs as needed.
        </div>
      </>
    ),
  },
  {
    id: 'webhook',
    name: 'Webhook',
    type: 'Log Stream',
    logo: '', // Will use a default icon
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Webhook</div>
        <div style={{ marginBottom: '8px' }}>
          Configure and monitor logging integrations within this deployment.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Logs will be routed to your configured drains as functions are called and events occur in your deployment.
        </div>
        <div>
          This gives you full flexibility to query, store, and process logs as needed.
        </div>
      </>
    ),
  },
  {
    id: 'fivetran',
    name: 'Fivetran',
    type: 'Streaming Export',
    logo: fivetranLogo,
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Fivetran</div>
        <div style={{ marginBottom: '8px' }}>
          Set up streaming export with third party connector platforms.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Fivetran and Airbyte are data integration platforms that allow you to export your Convex data to other databases and data warehouses like Snowflake, Databricks, BigTable, Tableau, and many others.
        </div>
        <div>
          <a
            href="https://docs.convex.dev/database/import-export/streaming"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more.
            <ExternalLink size={10} />
          </a>
        </div>
      </>
    ),
  },
  {
    id: 'airbyte',
    name: 'Airbyte',
    type: 'Streaming Export',
    logo: airbyteLogo,
    tooltip: (
      <>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Airbyte</div>
        <div style={{ marginBottom: '8px' }}>
          Set up streaming export with third party connector platforms.
        </div>
        <div style={{ marginBottom: '8px' }}>
          Fivetran and Airbyte are data integration platforms that allow you to export your Convex data to other databases and data warehouses like Snowflake, Databricks, BigTable, Tableau, and many others.
        </div>
        <div>
          <a
            href="https://docs.convex.dev/database/import-export/streaming"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-panel-accent)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Learn more.
            <ExternalLink size={10} />
          </a>
        </div>
      </>
    ),
  },
];

export const Integrations: React.FC<IntegrationsProps> = ({
  adminClient,
  accessToken,
  deploymentUrl,
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '49px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-panel-text)',
            margin: 0,
          }}
        >
          Integrations
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          position: 'relative',
        }}
      >
        {/* Introduction */}
        <div
          style={{
            marginBottom: '32px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-panel-text-secondary)',
              lineHeight: '1.6',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            Integrations allow you to send logs, report exceptions, and export Convex data to external services.{' '}
            <a
              href="https://docs.convex.dev/production/integrations/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-panel-accent)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Learn more about integrations.
              <ExternalLink size={12} style={{ display: 'inline-block' }} />
            </a>
          </p>
        </div>

        {/* Integrations Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.id}
              style={{
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                opacity: 0.6,
              }}
            >
              {/* PRO Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                }}
              >
                <ProBadge />
              </div>

              {/* Logo and Name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {integration.logo ? (
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      border: '1px solid var(--color-panel-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-panel-text-muted)',
                    }}
                  >
                    <Link2 size={20} />
                  </div>
                )}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text)',
                      margin: 0,
                    }}
                  >
                    {integration.name}
                  </h3>
                </div>
              </div>

              {/* Type Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  width: 'fit-content',
                  cursor: 'default',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-panel-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {integration.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '-32px',
            left: '-24px',
            right: '-24px',
            bottom: '-32px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              textAlign: 'center',
            }}
          >
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
};
