import { FetchFn } from "@/types";

export const mobileFetch: FetchFn = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : typeof input === 'object' && 'url' in input
        ? input.url
        : String(input);
  
  // for BigBrain API requests
  const headers = new Headers(init?.headers);
  
  if (url.includes('api.convex.dev')) {
    if (!headers.has('Origin')) {
      headers.set('Origin', 'https://convex-panel-mobile.app');
    }
  }
  
  return fetch(input as RequestInfo, {
    ...init,
    headers,
  });
};

