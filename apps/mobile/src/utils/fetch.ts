/**
 * Mobile Fetch Utility
 * 
 * Wraps fetch to add Origin header for BigBrain API requests
 */

import { FetchFn } from "@/types";



/**
 * Mobile fetch function that adds Origin header for BigBrain API requests
 * This is required by the BigBrain API for certain endpoints
 */
export const mobileFetch: FetchFn = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : typeof input === 'object' && 'url' in input
        ? input.url
        : String(input);
  
  // Add Origin header for BigBrain API requests
  const headers = new Headers(init?.headers);
  
  // Check if this is a BigBrain API request
  if (url.includes('api.convex.dev')) {
    // Set Origin header - required by BigBrain API
    // For React Native, we use a fixed origin since we don't have window.location
    if (!headers.has('Origin')) {
      headers.set('Origin', 'https://convex-panel-mobile.app');
    }
  }
  
  return fetch(input as RequestInfo, {
    ...init,
    headers,
  });
};

