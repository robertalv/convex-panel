/**
 * Helper to create filter history API for use in React components.
 * 
 * Note: This requires the component to be registered and codegen to be run.
 * Run `npx convex dev` in the backend directory to generate the API types.
 * 
 * Usage example in a component that uses DataFilterPanel:
 * ```tsx
 * import { useMutation } from 'convex/react';
 * import { api } from '../convex/_generated/api';
 * 
 * function MyComponent() {
 *   const pushFilterState = useMutation(api.filterHistory.push);
 *   const undoFilter = useMutation(api.filterHistory.undo);
 *   const redoFilter = useMutation(api.filterHistory.redo);
 *   
 *   // For queries, you'll need to use useQuery with the scope
 *   // and pass the result to the panel differently, or create
 *   // wrapper functions that use the Convex client directly
 *   
 *   const filterHistoryApi = {
 *     push: (scope: string, state: any) => pushFilterState({ scope, state }),
 *     undo: (scope: string, count?: number) => undoFilter({ scope, count }),
 *     redo: (scope: string, count?: number) => redoFilter({ scope, count }),
 *     getStatus: async (scope: string) => {
 *       // You'll need to use useQuery in the component and pass the result
 *       // or use the Convex client directly
 *       return { canUndo: false, canRedo: false, position: null, length: 0 };
 *     },
 *     getCurrentState: async (scope: string) => {
 *       // Similar to getStatus
 *       return null;
 *     },
 *   };
 *   
 *   return (
 *     <DataFilterPanel
 *       {...props}
 *       filterHistoryApi={filterHistoryApi}
 *       userId="user123"
 *     />
 *   );
 * }
 * ```
 */
