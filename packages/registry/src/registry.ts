/**
 * Registry API
 *
 * Functions for accessing the component registry.
 */

import type {
  RegistryComponent,
  RegistryResponse,
  ComponentCategory,
  ComponentStatus,
} from "./types";

// Import the static components data
import componentsData from "./data/components.json";

/**
 * Get all components from the registry
 */
export function getComponents(): RegistryResponse {
  const data = componentsData as {
    version: string;
    updatedAt: string;
    components: RegistryComponent[];
  };

  return {
    components: data.components,
    total: data.components.length,
    source: "static",
    updatedAt: data.updatedAt,
  };
}

/**
 * Get a component by ID
 */
export function getComponentById(id: string): RegistryComponent | undefined {
  const { components } = getComponents();
  return components.find((c) => c.id === id);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(
  category: ComponentCategory,
): RegistryComponent[] {
  const { components } = getComponents();
  return components.filter((c) => c.category === category);
}

/**
 * Get components by status
 */
export function getComponentsByStatus(
  status: ComponentStatus,
): RegistryComponent[] {
  const { components } = getComponents();
  return components.filter((c) => c.status === status);
}

/**
 * Search components by query string
 * Searches in name, description, and tags
 */
export function searchComponents(query: string): RegistryComponent[] {
  const { components } = getComponents();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return components;
  }

  return components.filter((c) => {
    const searchableText = [
      c.name,
      c.description,
      c.longDescription,
      c.npmPackage,
      ...(c.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

/**
 * Filter components with multiple criteria
 */
export function filterComponents(options: {
  query?: string;
  category?: ComponentCategory;
  status?: ComponentStatus;
  tags?: string[];
}): RegistryComponent[] {
  let { components } = getComponents();

  // Filter by query
  if (options.query) {
    const lowerQuery = options.query.toLowerCase().trim();
    components = components.filter((c) => {
      const searchableText = [
        c.name,
        c.description,
        c.longDescription,
        c.npmPackage,
        ...(c.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(lowerQuery);
    });
  }

  // Filter by category
  if (options.category) {
    components = components.filter((c) => c.category === options.category);
  }

  // Filter by status
  if (options.status) {
    components = components.filter((c) => c.status === options.status);
  }

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    components = components.filter((c) =>
      options.tags!.some((tag) => c.tags?.includes(tag)),
    );
  }

  return components;
}

/**
 * Get component count by category
 */
export function getComponentCountByCategory(): Record<
  ComponentCategory,
  number
> {
  const { components } = getComponents();
  const counts: Record<string, number> = {};

  for (const component of components) {
    counts[component.category] = (counts[component.category] || 0) + 1;
  }

  return counts as Record<ComponentCategory, number>;
}

/**
 * Get all unique tags from components
 */
export function getAllTags(): string[] {
  const { components } = getComponents();
  const tags = new Set<string>();

  for (const component of components) {
    if (component.tags) {
      for (const tag of component.tags) {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags).sort();
}

/**
 * Sort components by different criteria
 */
export function sortComponents(
  components: RegistryComponent[],
  sortBy: "name" | "downloads" | "category" | "status" = "name",
  order: "asc" | "desc" = "asc",
): RegistryComponent[] {
  const sorted = [...components].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "downloads":
        comparison = (a.weeklyDownloads || 0) - (b.weeklyDownloads || 0);
        break;
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}
