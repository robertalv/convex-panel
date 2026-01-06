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
  deploymentType: "prod" | "dev";
  projectId: number;
  url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  profilePictureUrl?: string; // Alias for avatarUrl, used by some APIs
}
