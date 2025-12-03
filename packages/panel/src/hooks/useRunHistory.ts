import { useCallback } from 'react';
import { useLocalStorage } from 'react-use';
import type { Dispatch, SetStateAction } from 'react';
import type { Value } from 'convex/values';

export interface UserIdentityAttributes {
  subject: string;
  issuer: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  preferredUsername?: string;
  profileUrl?: string;
  pictureUrl?: string;
  email?: string;
  emailVerified?: boolean;
  gender?: string;
  birthday?: string;
  timezone?: string;
  language?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  address?: string;
  updatedAt?: string;
  customClaims?: Record<string, any>;
}

export type RunHistoryItem = {
  startedAt: number;
  endedAt: number;
} & (
  | {
      type: 'arguments';
      arguments: Record<string, Value>;
      user?: UserIdentityAttributes;
    }
  | { type: 'custom'; code: string }
);

export function useRunHistory(
  functionIdentifier: string,
  componentId: string | null = null
): {
  runHistory: RunHistoryItem[];
  appendRunHistory: (item: RunHistoryItem) => void;
} {
  const storageKey = `runHistory/${componentId ? `${componentId}/` : ''}${functionIdentifier}`;
  const [runHistory, setRunHistory] = useLocalStorage<RunHistoryItem[]>(storageKey, []);

  const appendRunHistory = useCallback(
    (item: RunHistoryItem) => {
      setRunHistory((prev: RunHistoryItem[] = []) => {
        // Don't add duplicate entries
        if (prev.length > 0) {
          const last = prev[0];
          if (
            last.type === item.type &&
            last.type === 'arguments' &&
            item.type === 'arguments' &&
            JSON.stringify(last.arguments) === JSON.stringify(item.arguments) &&
            JSON.stringify(last.user) === JSON.stringify(item.user)
          ) {
            return prev;
          }
          if (
            last.type === item.type &&
            last.type === 'custom' &&
            item.type === 'custom' &&
            last.code === item.code
          ) {
            return prev;
          }
        }

        const newHistory = [item, ...prev];
        // Keep only last 25 items
        return newHistory.slice(0, 25);
      });
    },
    [setRunHistory]
  );

  return {
    runHistory: runHistory || [],
    appendRunHistory,
  };
}

export function useImpersonatedUser(): readonly [
  UserIdentityAttributes | null | undefined,
  Dispatch<SetStateAction<UserIdentityAttributes | null | undefined>>
] {
  const [user, setUser] = useLocalStorage<UserIdentityAttributes | null>(
    'functionRunner:impersonatedUser',
    null
  );
  return [user, setUser] as const;
}

export function useIsImpersonating(): readonly [boolean | undefined, Dispatch<SetStateAction<boolean | undefined>>] {
  const [isImpersonating, setIsImpersonating] = useLocalStorage<boolean>(
    'functionRunner:isImpersonating',
    false
  );
  return [isImpersonating, setIsImpersonating] as const;
}

