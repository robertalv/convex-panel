import React, { useState, useEffect, useMemo } from 'react';
import { FunctionRunner } from './function-runner';
import { ModuleFunction, discoverFunctions } from '../../utils/functionDiscovery';
import { fetchComponents } from '../../utils/api';
import { useIsGlobalRunnerShown, useHideGlobalRunner, useGlobalRunnerSelectedItem, useGlobalRunnerAutoRun } from '../../lib/functionRunner';
import { CustomQuery } from '../../types/functions';

interface GlobalFunctionTesterProps {
  adminClient: any;
  componentId?: string | null;
  deploymentUrl?: string;
  isVertical?: boolean;
  setIsVertical?: (vertical: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}

export const GlobalFunctionTester: React.FC<GlobalFunctionTesterProps> = ({
  adminClient,
  componentId,
  deploymentUrl,
  isVertical = false,
  setIsVertical,
  isExpanded = false,
  setIsExpanded,
}) => {
  const isShowing = useIsGlobalRunnerShown();
  const hideGlobalRunner = useHideGlobalRunner();
  const [selectedItem, setSelectedItem] = useGlobalRunnerSelectedItem();
  const [autoRun, setAutoRun] = useGlobalRunnerAutoRun();
  const [availableFunctions, setAvailableFunctions] = useState<ModuleFunction[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (adminClient && isShowing) {
        try {
          const [discoveredFunctions, discoveredComponents] = await Promise.all([
            discoverFunctions(adminClient, false),
            fetchComponents(adminClient, false).catch(() => []),
          ]);
          
          setAvailableFunctions(discoveredFunctions);
          setComponents(discoveredComponents);
          
          if (!selectedItem && discoveredFunctions.length > 0) {
            setSelectedItem({
              componentId: discoveredFunctions[0].componentId || null,
              fn: discoveredFunctions[0],
            });
          } else if (!selectedItem) {
            setSelectedItem({
              componentId: null,
              fn: { type: 'customQuery', table: null, componentId: null },
            });
          }
        } catch (error) {
          console.error('Error fetching functions/components:', error);
        }
      }
    };
    fetchData();
  }, [adminClient, isShowing, selectedItem, setSelectedItem]);

  const { componentList, componentIdMap } = useMemo(() => {
    const idToDisplayName = new Map<string, string>();
    const displayNameToId = new Map<string, string>();
    
    idToDisplayName.set('app', 'app');
    displayNameToId.set('app', 'app');
    
    components.forEach(comp => {
      const id = comp.id;
      const name = comp.name || comp.id; // Use name if available, fallback to id
      if (name) {
        const displayName = name.length > 20 ? `${name.substring(0, 20)}...` : name;
        idToDisplayName.set(name, displayName);
        displayNameToId.set(displayName, name);
        
        if (id && id !== name) {
          idToDisplayName.set(id, displayName);
          displayNameToId.set(displayName, name);
        }
      }
    });
    
    const componentNamesFromFunctions = new Set<string>();
    availableFunctions.forEach(fn => {
      if (fn.identifier && fn.identifier.includes(':')) {
        const firstPart = fn.identifier.split(':')[0];
        if (firstPart && !componentNamesFromFunctions.has(firstPart)) {
          const component = components.find(c => c.name === firstPart || c.id === firstPart);
          const matchesComponentId = fn.componentId === firstPart;
          
          if (component || matchesComponentId) {
            componentNamesFromFunctions.add(firstPart);
            if (!displayNameToId.has(firstPart)) {
              const componentName = component?.name || firstPart;
              const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
              idToDisplayName.set(componentName, displayName);
              displayNameToId.set(displayName, componentName);
            }
          }
        }
      }
      if (fn.componentId) {
        const component = components.find(c => c.id === fn.componentId || c.name === fn.componentId);
        const componentName = component?.name || fn.componentId;
        if (!idToDisplayName.has(componentName)) {
          const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
          idToDisplayName.set(componentName, displayName);
          displayNameToId.set(displayName, componentName);
        }
      }
    });
    
    const list = Array.from(displayNameToId.keys()).sort();
    return { componentList: list, componentIdMap: displayNameToId };
  }, [components, availableFunctions]);

  if (!isShowing) {
    return null;
  }

  const selectedFunction = selectedItem?.fn || null;

  const handleFunctionSelect = (fn: ModuleFunction | CustomQuery) => {
    setSelectedItem({
      componentId: 'type' in fn && fn.type === 'customQuery' 
        ? (fn.componentId ?? null)
        : (fn as ModuleFunction).componentId ?? null,
      fn,
    });
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#0F1115',
      }}
    >
          <FunctionRunner
            onClose={() => {
              setAutoRun(false);
              hideGlobalRunner('click');
            }}
            adminClient={adminClient}
            deploymentUrl={deploymentUrl}
            selectedFunction={selectedFunction}
            componentId={componentId || selectedItem?.componentId || null}
            availableFunctions={availableFunctions}
            availableComponents={componentList}
            componentIdMap={componentIdMap}
            onFunctionSelect={handleFunctionSelect}
            autoRun={autoRun}
            onAutoRunComplete={() => setAutoRun(false)}
          />
    </div>
  );
};

