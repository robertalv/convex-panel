export interface SharedConfig {
  version: string;
}

// Application types (User, Team, Project, Deployment, etc.)
export * from "./application";

// Filter types
export * from "./filters";

// Plan types
export * from "./plan";

// User types
export * from "./user";

// Panel types - excluding dashboard since it duplicates application types
export * from "./common";
export * from "./components";
export * from "./convex";
export * from "./editor";
export * from "./functions";
export * from "./logs";
export * from "./network";
export * from "./panel";
export * from "./tables";
export * from "./tabs";
