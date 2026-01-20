/**
 * Hook for loading component images with fallback support
 * 
 * Tries multiple image sources in order:
 * 1. NPM CDN (unpkg/jsdelivr)
 * 2. GitHub raw content
 * 3. Local static assets
 */

import { useState, useEffect } from "react";
import type { RegistryComponent } from "@convex-panel/registry";
import { getAllPotentialImageUrls } from "../utils/imageResolver";

/**
 * Hook to load component image with automatic fallback
 */
export function useComponentImage(component: RegistryComponent): {
  imageUrl: string;
  isLoading: boolean;
  error: Error | null;
} {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!component.image?.src) {
      setImageUrl("");
      setIsLoading(false);
      return;
    }

    // If it's already a full URL, use it directly
    if (
      component.image.src.startsWith("http://") ||
      component.image.src.startsWith("https://")
    ) {
      setImageUrl(component.image.src);
      setIsLoading(false);
      return;
    }

    // Get all potential URLs
    const urls = getAllPotentialImageUrls(component);
    if (urls.length === 0) {
      setImageUrl("");
      setIsLoading(false);
      return;
    }

    // Start with the first URL
    setIsLoading(true);
    setError(null);

    // Try to load the image
    const tryLoadImage = (url: string, index: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          setImageUrl(url);
          setIsLoading(false);
          setError(null);
          resolve();
        };
        
        img.onerror = () => {
          // Try next URL if available
          if (index < urls.length - 1) {
            tryLoadImage(urls[index + 1], index + 1).catch(reject);
          } else {
            // All URLs failed, use the first one anyway (browser will show broken image)
            setImageUrl(urls[0]);
            setIsLoading(false);
            setError(new Error("Failed to load image from all sources"));
            reject(new Error("Failed to load image"));
          }
        };
        
        img.src = url;
      });
    };

    tryLoadImage(urls[0], 0).catch(() => {
      // Error already handled in onerror
    });
  }, [component.id, component.image?.src, component.npmPackage, component.repoUrl]);

  return { imageUrl, isLoading, error };
}
