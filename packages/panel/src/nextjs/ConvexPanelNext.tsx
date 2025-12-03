"use client";

import React, { useEffect, useState } from 'react';
import ConvexPanelShadow from '../ConvexPanelShadow';
import { ConvexPanelProps } from '../ConvexPanel';

/**
 * Next.js-optimized ConvexPanel wrapper with SSR handling
 * 
 * This component handles client-side only rendering to prevent hydration issues
 * in Next.js applications. It automatically detects Next.js environment variables.
 */
export const ConvexPanelNext: React.FC<ConvexPanelProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only render on client side to avoid SSR/hydration issues
    setMounted(true);
  }, []);

  // Don't render anything during SSR
  if (!mounted) {
    return null;
  }

  return <ConvexPanelShadow {...props} />;
};

export default ConvexPanelNext;

