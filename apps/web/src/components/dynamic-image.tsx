"use client";

import { cn } from "../lib/utils";

interface DynamicImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
}

export function DynamicImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  width,
  height,
  onLoad,
  ...props
}: DynamicImageProps) {
  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        className={cn("dark:hidden", className)}
        width={width}
        height={height}
        onLoad={onLoad}
        {...props}
      />
      <img
        src={darkSrc}
        alt={alt}
        className={cn("hidden dark:block", className)}
        width={width}
        height={height}
        onLoad={onLoad}
        {...props}
      />
    </>
  );
}
