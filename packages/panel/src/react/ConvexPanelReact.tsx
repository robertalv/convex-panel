import ConvexPanelShadow from '../ConvexPanelShadow';
import type { ConvexPanelProps } from '../ConvexPanel';

/**
 * React/Vite-optimized ConvexPanel wrapper
 * 
 * This is a simple wrapper for React and Vite environments without SSR concerns.
 * It directly renders ConvexPanelShadow without any mounted state checks.
 */
export const ConvexPanelReact = (props: ConvexPanelProps) => {
  return <ConvexPanelShadow {...props} />;
};

export default ConvexPanelReact;

