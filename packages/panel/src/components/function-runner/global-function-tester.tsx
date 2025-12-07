import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FunctionRunner } from './function-runner';
import { discoverFunctions } from '../../utils/api/functionDiscovery';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import { fetchComponents } from '../../utils/api/functions';
import { useIsGlobalRunnerShown, useHideGlobalRunner, useGlobalRunnerSelectedItem, useGlobalRunnerAutoRun } from '../../lib/functionRunner';
import type { CustomQuery } from '../../types/functions';
import { useSheetSafe } from '../../contexts/sheet-context';

interface GlobalFunctionTesterProps {
  adminClient: any;
  componentId?: string | null;
  deploymentUrl?: string;
  isVertical?: boolean;
  setIsVertical?: (vertical: boolean) => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  container?: HTMLElement | null;
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
  const { openSheet, closeSheet } = useSheetSafe();
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

  const handleClose = useCallback(() => {
    setAutoRun(false);
    hideGlobalRunner();
    if (isVertical) {
      closeSheet();
    }
  }, [isVertical, closeSheet]);

  const sheetContent = useMemo(() => (
    <FunctionRunner
      accessToken={adminClient.accessToken}
      onClose={handleClose}
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
      isVertical={true}
      setIsVertical={(val) => {
        setIsVertical?.(val);
        if (!val) {
          closeSheet();
        }
      }}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
    />
  ), [handleClose, adminClient, deploymentUrl, selectedFunction, componentId, selectedItem, availableFunctions, componentList, componentIdMap, handleFunctionSelect, autoRun, isExpanded, setIsExpanded, setIsVertical, closeSheet]);

  // Open Sheet when vertical mode is activated
  useEffect(() => {
    if (!isShowing) {
      closeSheet();
      return;
    }

    if (isVertical) {
      openSheet({
        width: isExpanded ? '100%' : '500px',
        content: sheetContent,
        fullscreen: isExpanded,
      });
    } else {
      closeSheet();
    }
  }, [isVertical, isShowing, isExpanded, openSheet, closeSheet, sheetContent]);

  // When vertical, don't render inline - Sheet handles it
  if (isVertical) {
    return null;
  }

  return (
    <FunctionRunner
      onClose={handleClose}
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
      isVertical={false}
      setIsVertical={(val) => {
        setIsVertical?.(val);
      }}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
    />
  );
};

