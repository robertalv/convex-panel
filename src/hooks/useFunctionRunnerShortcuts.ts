import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIsGlobalRunnerShown, useShowGlobalRunner, useHideGlobalRunner } from '../lib/functionRunner';

export function useFunctionRunnerShortcuts() {
  const isShowing = useIsGlobalRunnerShown();
  const showGlobalRunner = useShowGlobalRunner();
  const hideGlobalRunner = useHideGlobalRunner();

  // Toggle with Ctrl+` or Cmd+`
  useHotkeys(
    'ctrl+`',
    (e) => {
      e.preventDefault();
      if (isShowing) {
        hideGlobalRunner('keyboard');
      } else {
        showGlobalRunner(null, 'keyboard');
      }
    },
    { enableOnFormTags: true }
  );

  // Also support Cmd+` on Mac
  useHotkeys(
    'meta+`',
    (e) => {
      e.preventDefault();
      if (isShowing) {
        hideGlobalRunner('keyboard');
      } else {
        showGlobalRunner(null, 'keyboard');
      }
    },
    { enableOnFormTags: true }
  );
}

