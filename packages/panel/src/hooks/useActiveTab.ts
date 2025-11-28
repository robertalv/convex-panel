import { useState, useEffect, useCallback } from 'react';
import { TabId } from '../types/tabs';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

const DEFAULT_TAB: TabId = 'health';

export const useActiveTab = (initialTab?: TabId): [TabId, (tab: TabId) => void] => {
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<TabId>(STORAGE_KEYS.ACTIVE_TAB, initialTab || DEFAULT_TAB);
    }
    return initialTab || DEFAULT_TAB;
  });

  useEffect(() => {
    if (activeTab) {
      setStorageItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
  }, []);

  return [activeTab, setActiveTab];
};

