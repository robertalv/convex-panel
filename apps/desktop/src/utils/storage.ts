/**
 * Storage utility for persisting settings in the desktop app
 * Uses localStorage for simplicity
 */

const STORAGE_PREFIX = 'convex-panel-desktop:';

export interface OAuthSettings {
    clientId: string;
    redirectUri: string;
    scope: 'team' | 'project';
}

export function getOAuthSettings(): OAuthSettings | null {
    try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}oauth-settings`);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('[Storage] Failed to get OAuth settings:', error);
    }
    return null;
}

export function setOAuthSettings(settings: OAuthSettings): void {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}oauth-settings`, JSON.stringify(settings));
    } catch (error) {
        console.error('[Storage] Failed to set OAuth settings:', error);
    }
}

export function clearOAuthSettings(): void {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}oauth-settings`);
    } catch (error) {
        console.error('[Storage] Failed to clear OAuth settings:', error);
    }
}

export function getStorageItem<T>(key: string, defaultValue?: T): T | null {
    try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (stored) {
            return JSON.parse(stored) as T;
        }
    } catch (error) {
        console.error(`[Storage] Failed to get item ${key}:`, error);
    }
    return defaultValue ?? null;
}

export function setStorageItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
        console.error(`[Storage] Failed to set item ${key}:`, error);
    }
}

export function removeStorageItem(key: string): void {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
        console.error(`[Storage] Failed to remove item ${key}:`, error);
    }
}
