import { useState, useEffect, useMemo } from 'react';
import { fetchComponents } from '../utils/api';

export interface UseComponentsProps {
  adminClient: any;
  useMockData?: boolean;
}

export interface UseComponentsReturn {
  components: any[];
  isLoadingComponents: boolean;
  componentNames: string[];
  componentNameToId: Map<string, string>;
  selectedComponentId: string | null;
  selectedComponent: string | null;
  setSelectedComponent: (component: string | null) => void;
}

export function useComponents({
  adminClient,
  useMockData = false,
}: UseComponentsProps): UseComponentsReturn {
  const [selectedComponent, setSelectedComponent] = useState<string | null>('app');
  const [components, setComponents] = useState<any[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

  useEffect(() => {
    if (!adminClient || useMockData) {
      setComponents([]);
      return;
    }

    setIsLoadingComponents(true);
    fetchComponents(adminClient, useMockData)
      .then((comps) => {
        setComponents(comps || []);
      })
      .catch((error) => {
        console.error('Error fetching components:', error);
        setComponents([]);
      })
      .finally(() => {
        setIsLoadingComponents(false);
      });
  }, [adminClient, useMockData]);

  const componentNameToId = useMemo(() => {
    const map = new Map<string, string>();
    components.forEach((comp) => {
      if (comp.name && comp.id) {
        map.set(comp.name, comp.id);
      }
    });
    return map;
  }, [components]);

  const selectedComponentId = useMemo(() => {
    if (selectedComponent === 'app' || selectedComponent === null) {
      return null;
    }
    const componentId = componentNameToId.get(selectedComponent) || null;
    return componentId;
  }, [selectedComponent, componentNameToId]);

  const componentNames = useMemo(() => {
    const names = ['app'];
    components.forEach((comp) => {
      if (comp.name && comp.name.trim() !== '') {
        names.push(comp.name);
      }
    });
    return names;
  }, [components]);

  return {
    components,
    isLoadingComponents,
    componentNames,
    componentNameToId,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  };
}

