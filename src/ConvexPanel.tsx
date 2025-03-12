import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, useDragControls } from 'framer-motion';
import { motion } from 'framer-motion';
import { ButtonProps } from './types';
import { LogType } from './logs/types';
import { defaultTheme, buttonVariants } from './theme';
import Container from './Container';
import { ConvexReactClient } from 'convex/react';
import { ConvexClient } from 'convex/browser';
// CSS will be imported by the user

const ConvexPanel = ({
  children,
  initialLimit = 100,
  initialShowSuccess = true,
  initialLogType = LogType.ALL,
  onLogFetch,
  onError,
  onToggle,
  theme = {},
  buttonIcon = "/convex.png",
  maxStoredLogs = 500,
  convex,
  deployKey,
  cloudUrl,
}: ButtonProps) => {
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);

  // Only create adminClient if we have a URL and deployKey
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || cloudUrl;
  const adminClient = convexUrl && deployKey ? new ConvexClient(convexUrl) : null;
  
  // Only set admin auth if we have an adminClient and deployKey
  if (adminClient && deployKey) {
    (adminClient as any).setAdminAuth(deployKey);
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 500 });
  const dragControls = useDragControls();

  /**
   * Load saved position and container size from localStorage on component mount
   */
  useEffect(() => {
    const savedPosition = localStorage.getItem('convex-panel:position');
    const savedSize = localStorage.getItem('convex-panel:size');
    
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position', e);
      }
    }
    
    if (savedSize) {
      try {
        setContainerSize(JSON.parse(savedSize));
      } catch (e) {
        console.error('Failed to parse saved size', e);
      }
    }
  }, []);

  /**
   * Save position and container size to localStorage when they change
   */
  useEffect(() => {
    localStorage.setItem('convex-panel:position', JSON.stringify(position));
    localStorage.setItem('convex-panel:size', JSON.stringify(containerSize));
  }, [position, containerSize]);

  /**
   * Toggle the open state of the container
   */
  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  return (
    <div className="convex-panel-container">
      <AnimatePresence>
        {isOpen && (
          <Container
            convex={convex as ConvexReactClient}
            isOpen={isOpen}
            toggleOpen={toggleOpen}
            onToggle={onToggle}
            initialLimit={initialLimit}
            initialShowSuccess={initialShowSuccess}
            initialLogType={initialLogType}
            onLogFetch={onLogFetch}
            onError={onError}
            theme={mergedTheme}
            maxStoredLogs={maxStoredLogs}
            position={position}
            setPosition={setPosition}
            containerSize={containerSize}
            setContainerSize={setContainerSize}
            dragControls={dragControls}
            adminClient={adminClient}
          />
        )}
      </AnimatePresence>
      
      <motion.button
        className="convex-panel-button"
        onClick={toggleOpen}
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Image 
          src={buttonIcon}
          alt="Convex Logo" 
          width={36} 
          height={36} 
          className="rounded-full"
        />
      </motion.button>
    </div>
  );
};

export default ConvexPanel; 