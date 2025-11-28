import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ExternalLink,
  Pause,
  Trash2,
} from 'lucide-react';
import { ComponentSelector } from '../../components/function-runner/components/component-selector';
import { FunctionSelector } from '../../components/function-runner/components/function-selector';
import { discoverFunctions, ModuleFunction } from '../../utils/functionDiscovery';
import { CustomQuery } from '../../components/function-runner/function-runner';
import { fetchComponents } from '../../utils/api';

export interface SchedulesViewProps {
  adminClient?: any;
  accessToken?: string;
  useMockData?: boolean;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  adminClient,
  accessToken,
  useMockData = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<'scheduled' | 'cron'>('scheduled');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [functions, setFunctions] = useState<ModuleFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | CustomQuery | null>(null);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);
  const [components, setComponents] = useState<any[]>([]);
  useEffect(() => {
    if (!adminClient) return;

    setIsLoadingFunctions(true);
    Promise.all([
      discoverFunctions(adminClient, useMockData),
      fetchComponents(adminClient, useMockData).catch(() => []),
    ])
      .then(([funcs, comps]) => {
        setFunctions(funcs);
        setComponents(comps);
      })
      .catch((error) => {
        console.error('Error fetching functions/components:', error);
      })
      .finally(() => {
        setIsLoadingFunctions(false);
      });
  }, [adminClient, useMockData]);

  const componentList = useMemo(() => {
    const componentSet = new Set<string>(['app']);
    const idToDisplayName = new Map<string, string>();
    
    components.forEach(comp => {
      const id = comp.id;
      const name = comp.name || comp.id;
      if (name) {
        const displayName = name.length > 20 ? `${name.substring(0, 20)}...` : name;
        componentSet.add(displayName);
        idToDisplayName.set(id, displayName);
        if (id !== name) {
          idToDisplayName.set(name, displayName);
        }
      }
    });
    
    const componentNamesFromFunctions = new Set<string>();
    functions.forEach(fn => {
      if (fn.identifier && fn.identifier.includes(':')) {
        const firstPart = fn.identifier.split(':')[0];
        if (firstPart && !componentNamesFromFunctions.has(firstPart)) {
          const component = components.find(c => c.name === firstPart || c.id === firstPart);
          const matchesComponentId = fn.componentId === firstPart;
          
          if (component || matchesComponentId) {
            componentNamesFromFunctions.add(firstPart);
            const componentName = component?.name || firstPart;
            const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
            if (!componentSet.has(displayName)) {
              componentSet.add(displayName);
            }
          }
        }
      }
      if (fn.componentId) {
        const component = components.find(c => c.id === fn.componentId || c.name === fn.componentId);
        const componentName = component?.name || fn.componentId;
        const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
        if (!componentSet.has(displayName)) {
          componentSet.add(displayName);
        }
      }
    });
    
    return Array.from(componentSet).sort();
  }, [components, functions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0F1115' }}>
      {/* Header */}
      <div style={{
        height: '48px',
        borderBottom: '1px solid #2D313A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Schedules</h2>
        <div style={{ width: '192px' }}>
          <ComponentSelector
            selectedComponent={selectedComponent}
            onSelect={setSelectedComponent}
            components={componentList}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '0 16px',
        borderBottom: '1px solid #2D313A',
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
      }}>
        <button
          onClick={() => setSelectedTab('scheduled')}
          style={{
            padding: '12px 0',
            color: selectedTab === 'scheduled' ? '#fff' : '#9ca3af',
            fontWeight: selectedTab === 'scheduled' ? 500 : 400,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'scheduled' ? '2px solid #fff' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          Scheduled Functions
        </button>
        <button
          onClick={() => setSelectedTab('cron')}
          style={{
            padding: '12px 0',
            color: selectedTab === 'cron' ? '#fff' : '#9ca3af',
            fontWeight: selectedTab === 'cron' ? 500 : 400,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'cron' ? '2px solid #fff' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          Cron Jobs
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2D313A',
        display: 'flex',
        gap: '8px',
      }}>
        <div style={{ width: '192px' }}>
          <FunctionSelector
            selectedFunction={selectedFunction}
            onSelect={setSelectedFunction}
            functions={functions}
            componentId={selectedComponent}
          />
        </div>
        <button style={{
          padding: '6px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#f87171',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
          Cancel All
        </button>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #2D313A',
        fontSize: '12px',
        fontWeight: 500,
        color: '#9ca3af',
      }}>
        <div style={{ width: '96px' }}>ID</div>
        <div style={{ width: '128px' }}>Scheduled Time</div>
        <div style={{ width: '96px' }}>Status</div>
        <div style={{ flex: 1 }}>Function</div>
        <div style={{ width: '32px' }}>
          <Pause style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
        </div>
      </div>

      {/* Empty State */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <Calendar style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 500,
          color: '#fff',
          marginBottom: '8px',
        }}>
          Schedule functions to run later
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginBottom: '24px',
          maxWidth: '384px',
        }}>
          Scheduled functions can run after an amount of time passes, or at a specific date.
        </p>
        <a
          href="#"
          style={{
            fontSize: '14px',
            color: '#60a5fa',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          <ExternalLink style={{ width: '12px', height: '12px' }} />
          Learn more about scheduled functions
        </a>
      </div>
    </div>
  );
};

