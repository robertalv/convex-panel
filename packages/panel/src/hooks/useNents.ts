import { Value } from "convex/values";
import { useRouter } from "next/router";
import { useMemo } from "react";

// Since we don't have access to the actual generated types, we'll define our own
type Id<T extends string> = string & { __type: T };

export const NENT_APP_PLACEHOLDER = "_App";

export type ComponentId = Id<"_components"> | null;
export type Nent = {
  name: string | null;
  id: ComponentId;
  path: string;
  args: Record<string, Value>;
  state?: "active" | "unmounted";
};

export function useNents(): {
  nents?: Nent[];
  selectedNent: Nent | null;
  setSelectedNent: (nent?: string) => Promise<void>;
} {
  const { query, push } = useRouter();
  // Mock the query result for now since we don't have access to the actual API
  const allComponents: Nent[] | undefined = useMemo(() => [], []);

  // Ensure the selected component is in the list of all components
  if (allComponents !== undefined && typeof query.component === "string") {
    const found = allComponents.find((c: Nent) => c.id === query.component);
    if (!found) {
      delete query.component;
    }
  }

  const selectedNent = (query.component as string | undefined) ?? null;

  const setSelectedNent = async (nent?: string) => {
    if (!nent) {
      delete query.component;
      await push({ query });
      return;
    }
    await push({ query: { ...query, component: nent } }, undefined, {
      shallow: true,
    });
  };

  const nents: Nent[] | undefined = useMemo(
    () =>
      allComponents
        ? [
            {
              name: null,
              id: NENT_APP_PLACEHOLDER as Id<"_components">,
              path: NENT_APP_PLACEHOLDER,
              args: {},
              state: "active",
            },
            ...allComponents,
          ]
        : undefined,
    [allComponents],
  );

  return {
    selectedNent: allComponents?.find((n: Nent) => n.id === selectedNent) || null,
    setSelectedNent,
    nents,
  };
} 