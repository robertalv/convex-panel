import React, { useState, useEffect, useMemo } from 'react';
import { FunctionRunner, CustomQuery } from './function-runner';
import { ModuleFunction, discoverFunctions } from '../../utils/functionDiscovery';
import { fetchComponents } from '../../utils/api';
import { useIsGlobalRunnerShown, useHideGlobalRunner, useGlobalRunnerSelectedItem } from '../../lib/functionRunner';

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
  const [availableFunctions, setAvailableFunctions] = useState<ModuleFunction[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (adminClient && isShowing) {
        try {
          // Fetch both functions and components in parallel
          const [discoveredFunctions, discoveredComponents] = await Promise.all([
            discoverFunctions(adminClient, false),
            fetchComponents(adminClient, false).catch(() => []), // Don't fail if components aren't available
          ]);
          
          setAvailableFunctions(discoveredFunctions);
          setComponents(discoveredComponents);
          
          // If no function is selected, default to the first one or a custom query
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
  
  // Build component list from both discovered components and function componentIds
  // Use component names for display, but store mapping to IDs/names for selection
  // Component functions have identifiers like: "componentName:moduleName:functionName"
  // So we need to use component names (not IDs) for filtering by identifier pattern
  const { componentList, componentIdMap } = useMemo(() => {
    const idToDisplayName = new Map<string, string>(); // componentId/name -> displayName
    const displayNameToId = new Map<string, string>(); // displayName -> componentId/name
    
    // Always include 'app' as the default
    idToDisplayName.set('app', 'app');
    displayNameToId.set('app', 'app');
    
    // Add components from the components API - prefer name over id for display
    // Component names are used in function identifiers, so we should use names for filtering
    components.forEach(comp => {
      const id = comp.id;
      const name = comp.name || comp.id; // Use name if available, fallback to id
      if (name) {
        // Use name as both the key and display name (since names are used in identifiers)
        const displayName = name.length > 20 ? `${name.substring(0, 20)}...` : name;
        idToDisplayName.set(name, displayName);
        displayNameToId.set(displayName, name); // Map display name back to component name (used in identifiers)
        
        // Also map by ID if different from name
        if (id && id !== name) {
          idToDisplayName.set(id, displayName);
          displayNameToId.set(displayName, name); // Still use name for identifier matching
        }
      }
    });
    
    // Add componentIds from functions (use as fallback if not in components API)
    // Extract component names from function identifiers (first part before colon)
    // This is important because component functions use component names in identifiers, not IDs
    const componentNamesFromFunctions = new Set<string>();
    availableFunctions.forEach(fn => {
      if (fn.identifier && fn.identifier.includes(':')) {
        const firstPart = fn.identifier.split(':')[0];
        // Check if this looks like a component name (not a module name)
        // We'll add it if it's not already in our list
        if (firstPart && !componentNamesFromFunctions.has(firstPart)) {
          // Check if this matches a component from the API
          const component = components.find(c => c.name === firstPart || c.id === firstPart);
          // Also check if componentId matches (could be name or ID)
          const matchesComponentId = fn.componentId === firstPart;
          
          if (component || matchesComponentId) {
            componentNamesFromFunctions.add(firstPart);
            if (!displayNameToId.has(firstPart)) {
              // Use the component name from API if available, otherwise use firstPart
              const componentName = component?.name || firstPart;
              const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
              idToDisplayName.set(componentName, displayName);
              displayNameToId.set(displayName, componentName); // Map to component name (used in identifiers)
            }
          }
        }
      }
      // Also check componentId directly - use component name if available
      if (fn.componentId) {
        const component = components.find(c => c.id === fn.componentId || c.name === fn.componentId);
        // Prefer component name over ID for identifier matching
        const componentName = component?.name || fn.componentId;
        if (!idToDisplayName.has(componentName)) {
          const displayName = componentName.length > 20 ? `${componentName.substring(0, 20)}...` : componentName;
          idToDisplayName.set(componentName, displayName);
          displayNameToId.set(displayName, componentName); // Map to component name
        }
      }
    });
    
    // Return sorted array of display names for the dropdown
    const list = Array.from(displayNameToId.keys()).sort();
    return { componentList: list, componentIdMap: displayNameToId };
  }, [components, availableFunctions]);

  if (!isShowing) {
    return null;
  }

  const selectedFunction = selectedItem?.fn || null;

  const handleFunctionSelect = (fn: ModuleFunction | CustomQuery) => {
    // Update the global selected item when function is selected
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
            onClose={() => hideGlobalRunner('click')}
            adminClient={adminClient}
            deploymentUrl={deploymentUrl}
            selectedFunction={selectedFunction}
            componentId={componentId || selectedItem?.componentId || null}
            availableFunctions={availableFunctions}
            availableComponents={componentList}
            componentIdMap={componentIdMap}
            onFunctionSelect={handleFunctionSelect}
          />
    </div>
  );
};

