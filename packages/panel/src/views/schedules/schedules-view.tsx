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
    <div className="cp-schedules-container">
      {/* Header */}
      <div className="cp-schedules-header">
        <h2 className="cp-schedules-title">Schedules</h2>
        <div style={{ width: '192px' }}>
          <ComponentSelector
            selectedComponent={selectedComponent}
            onSelect={setSelectedComponent}
            components={componentList}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-schedules-tabs">
        <button
          onClick={() => setSelectedTab('scheduled')}
          className={`cp-schedules-tab ${selectedTab === 'scheduled' ? 'active' : ''}`}
        >
          Scheduled Functions
        </button>
        <button
          onClick={() => setSelectedTab('cron')}
          className={`cp-schedules-tab ${selectedTab === 'cron' ? 'active' : ''}`}
        >
          Cron Jobs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="cp-schedules-filters">
        <div style={{ width: '192px' }}>
          <FunctionSelector
            selectedFunction={selectedFunction}
            onSelect={setSelectedFunction}
            functions={functions}
            componentId={selectedComponent}
          />
        </div>
        <button className="cp-schedules-cancel-btn">
          <Trash2 style={{ width: '14px', height: '14px' }} />
          Cancel All
        </button>
      </div>

      {/* Table Header */}
      <div className="cp-schedules-table-header">
        <div style={{ width: '96px' }}>ID</div>
        <div style={{ width: '128px' }}>Scheduled Time</div>
        <div style={{ width: '96px' }}>Status</div>
        <div style={{ flex: 1 }}>Function</div>
        <div style={{ width: '32px' }}>
          <Pause style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
        </div>
      </div>

      {/* Empty State */}
      <div className="cp-schedules-empty">
        <div className="cp-schedules-empty-icon">
          <Calendar style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
        </div>
        <h3 className="cp-schedules-empty-title">
          Schedule functions to run later
        </h3>
        <p className="cp-schedules-empty-desc">
          Scheduled functions can run after an amount of time passes, or at a specific date.
        </p>
        <a href="#" className="cp-schedules-empty-link">
          <ExternalLink style={{ width: '12px', height: '12px' }} />
          Learn more about scheduled functions
        </a>
      </div>
    </div>
  );
};

