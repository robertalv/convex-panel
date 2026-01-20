export interface Team {
  id: number;
  name: string;
  slug: string;
  referralCode?: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  teamId: number;
}

export interface Deployment {
  id: number;
  name: string;
  deploymentType: "prod" | "dev" | "preview";
  projectId: number;
  kind?: "cloud" | "local";
  creator?: number;
  previewIdentifier?: string | null;
  url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  profilePictureUrl?: string; // Alias for avatarUrl, used by some APIs
}
