import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva("", {
  variants: {
    size: {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12",
      "2xl": "w-16 h-16",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface SpinnerProps
  extends
    React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 367 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size }), "text-text-muted", className)}
      {...props}
    >
      <style>
        {`
          @keyframes shimmer-1 {
            0%, 100% { opacity: 0.3; }
            33% { opacity: 1; }
          }
          @keyframes shimmer-2 {
            0%, 100% { opacity: 0.3; }
            66% { opacity: 1; }
          }
          @keyframes shimmer-3 {
            0%, 100% { opacity: 0.3; }
            99% { opacity: 1; }
          }
          .petal-1 { animation: shimmer-1 1.5s ease-in-out infinite; }
          .petal-2 { animation: shimmer-2 1.5s ease-in-out infinite; }
          .petal-3 { animation: shimmer-3 1.5s ease-in-out infinite; }
        `}
      </style>
      <g transform="matrix(1,0,0,1,-129.225,-127.948)">
        <g transform="matrix(4.16667,0,0,4.16667,0,0)">
          {/* Yellow petal - now grayscale */}
          <g transform="matrix(1,0,0,1,86.6099,107.074)">
            <path
              className="petal-1"
              d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544"
              fill="currentColor"
            />
          </g>
          {/* Purple petal - now grayscale */}
          <g transform="matrix(1,0,0,1,47.1708,74.7779)">
            <path
              className="petal-2"
              d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489"
              fill="currentColor"
            />
          </g>
          {/* Red petal - now grayscale */}
          <g transform="matrix(1,0,0,1,91.325,66.4152)">
            <path
              className="petal-3"
              d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * Convex logo spinner with color and pulsing petals.
 * Each petal pulses in sequence for a breathing effect.
 */
export function SpinnerColor({ className, size, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 367 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <style>
        {`
          @keyframes shimmer-color-1 {
            0%, 100% { opacity: 0.4; }
            33% { opacity: 1; }
          }
          @keyframes shimmer-color-2 {
            0%, 100% { opacity: 0.4; }
            66% { opacity: 1; }
          }
          @keyframes shimmer-color-3 {
            0%, 100% { opacity: 0.4; }
            99% { opacity: 1; }
          }
          .petal-color-1 { animation: shimmer-color-1 1.5s ease-in-out infinite; }
          .petal-color-2 { animation: shimmer-color-2 1.5s ease-in-out infinite; }
          .petal-color-3 { animation: shimmer-color-3 1.5s ease-in-out infinite; }
        `}
      </style>
      <g transform="matrix(1,0,0,1,-129.225,-127.948)">
        <g transform="matrix(4.16667,0,0,4.16667,0,0)">
          {/* Yellow petal */}
          <g transform="matrix(1,0,0,1,86.6099,107.074)">
            <path
              className="petal-color-1"
              d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544"
              fill="rgb(245,176,26)"
            />
          </g>
          {/* Purple petal */}
          <g transform="matrix(1,0,0,1,47.1708,74.7779)">
            <path
              className="petal-color-2"
              d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489"
              fill="rgb(141,37,118)"
            />
          </g>
          {/* Red petal */}
          <g transform="matrix(1,0,0,1,91.325,66.4152)">
            <path
              className="petal-color-3"
              d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199"
              fill="rgb(238,52,47)"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * Simple circular spinner for inline use.
 * Uses current text color.
 */
export function SpinnerCircle({ className, size, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(spinnerVariants({ size }), "animate-spin", className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
