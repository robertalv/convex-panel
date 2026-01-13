export const ROUTES = {
  QUERY: "/api/query",
  MUTATION: "/api/mutation",
  QUERY_BATCH: "/api/admin/query_batch",
  STORAGE: "/api/storage",
  STORAGE_UPLOAD: "/api/storage/upload",
  REFERRAL_URL: "https://convex.dev/referral",
} as const;

export const SYSTEM_QUERIES = {
  GET_FILE: "_system/frontend/fileStorageV2:getFile",
  GET_FILE_METADATA: "_system/frontend/fileStorageV2:fileMetadata",
  LIST_DOCUMENTS: "system:listDocuments",
  QUERY: "system:query",
} as const;

export const SYSTEM_MUTATIONS = {
  GENERATE_UPLOAD_URL: "_system/frontend/fileStorageV2:generateUploadUrl",
  DELETE_FILES: "_system/frontend/fileStorageV2:deleteFiles",
} as const;

export const QUICK_LINKS = [
  {
    label: "Documentation",
    href: "https://docs.convex.dev",
    icon: "bookOpen",
  },
  {
    label: "Tutorial",
    href: "https://docs.convex.dev/tutorial",
    icon: "play",
  },
  {
    label: "API Reference",
    href: "https://docs.convex.dev/api",
    icon: "code",
  },
];

export const STORAGE_PREFIX = "convex-desktop:";
export const HEALTH_STORAGE_PREFIX = "health_";

export const STORAGE_KEYS = {
  sidebarWidth: `${STORAGE_PREFIX}sidebar-width`,
  sidebarCollapsed: `${STORAGE_PREFIX}sidebar-collapsed`,
  team: `${STORAGE_PREFIX}team`,
  project: `${STORAGE_PREFIX}project`,
  deployment: `${STORAGE_PREFIX}deployment`,
  deployUrl: `${STORAGE_PREFIX}deploy-url`,
  theme: `${STORAGE_PREFIX}theme`,
  authMethod: `${STORAGE_PREFIX}auth-method`,
};

export const SEVERITY_OPTIONS = [
  { value: "all", label: "All severities" },
  { value: "error", label: "Errors only" },
  { value: "warning", label: "Warnings only" },
  { value: "info", label: "Suggestions only" },
];