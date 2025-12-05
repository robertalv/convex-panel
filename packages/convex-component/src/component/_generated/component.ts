/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { scope: string },
        null,
        Name
      >;
      createCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null,
        Name
      >;
      deleteCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null,
        Name
      >;
      deleteScope: FunctionReference<
        "mutation",
        "internal",
        { scope: string },
        null,
        Name
      >;
      getCheckpointState: FunctionReference<
        "query",
        "internal",
        { name: string; scope: string },
        any | null,
        Name
      >;
      getCurrentState: FunctionReference<
        "query",
        "internal",
        { scope: string },
        any | null,
        Name
      >;
      getStateAtPosition: FunctionReference<
        "query",
        "internal",
        { position: number; scope: string },
        any | null,
        Name
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { scope: string },
        {
          canRedo: boolean;
          canUndo: boolean;
          length: number;
          position: number | null;
        },
        Name
      >;
      listCheckpoints: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ name: string; position: number | null }>,
        Name
      >;
      listStates: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ position: number; state: any }>,
        Name
      >;
      push: FunctionReference<
        "mutation",
        "internal",
        { maxStates?: number; scope: string; state: any },
        null,
        Name
      >;
      redo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null,
        Name
      >;
      restoreCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { maxStates?: number; name: string; scope: string },
        any,
        Name
      >;
      undo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null,
        Name
      >;
    };
  };
