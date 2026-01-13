import packageJson from '../../package.json';
import Constants from 'expo-constants';

export const APP_VERSION = packageJson.version;
export const GIT_COMMIT_HASH = 
  (process.env.EXPO_PUBLIC_GIT_COMMIT_HASH as string | undefined) || 
  'unknown';

export const GIT_REPO_URL = 
  (process.env.EXPO_PUBLIC_GIT_REPO_URL as string | undefined) || 
  '';

export const BUILD_NUMBER = 
  Constants.expoConfig?.ios?.buildNumber || 
  Constants.expoConfig?.android?.versionCode?.toString() || 
  'unknown';
