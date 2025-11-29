import React, { useState, useEffect, useMemo, Activity } from 'react';
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
// import { fetchComponents } from '../../utils/api';
import { useComponents } from '../../hooks/useComponents';
import { useFunctions } from '../../hooks/useFunctions';
import { usePaginatedScheduledJobs } from '../../hooks/usePaginatedScheduledJobs';
// import { getDeploymentUrl } from 'src/utils/adminClient';
import { getDeploymentUrl } from '../../utils/adminClient';

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
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);
  const [components, setComponents] = useState<any[]>([]);
  
  const {
    componentNames:componentList,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  } = useComponents({
    adminClient,
    useMockData,
  });
  
  const {
    functions:allFunctions,
    groupedFunctions,
    isLoading,
    error: functionsError,
  } = useFunctions({
    adminClient,
    useMockData,
    componentId: selectedComponent,
    // onError
  });
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction |CustomQuery | null>(allFunctions?.[0]);

    const deploymentUrl = getDeploymentUrl(adminClient)
    // get functions view, we first want to see the current selected component
    // this is a copy
    const {results} = usePaginatedScheduledJobs(
      (selectedFunction && 'identifier' in selectedFunction) ? selectedFunction.identifier : undefined,
      adminClient,
      deploymentUrl ?? "",
    )

    useEffect(()=>{
      setSelectedFunction(allFunctions[0])
    },[allFunctions,setSelectedFunction])

    useEffect(()=>{
      console.log("selected function", selectedFunction)
      console.log("all functions", allFunctions)
      console.log("paginated Results", results)
    },[selectedFunction, allFunctions, results])
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

      <Activity mode={selectedTab ==="scheduled" ? "visible":"hidden"}>
      {/* Filters Bar */}
      <div className="cp-schedules-filters">
        <div style={{ width: '192px' }}>
          <FunctionSelector
            selectedFunction={selectedFunction}
            onSelect={setSelectedFunction}
            functions={allFunctions}
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
      </Activity>

    </div>
  );
};
interface SharedProps{
  selectedTab: "scheduled" | "cron", 
  // refers to app etc, but also refers to components
  selectedComponent: ""
}

// Add Schedules and crons here for now! 
export const ScheduledFunctionsView = (
  currentOpenFunction
:{ currentOpenFunction: ModuleFunction | undefined;}) => {

  return <div>
    ssss
  </div>
}

export const CronJobsView = () => {}