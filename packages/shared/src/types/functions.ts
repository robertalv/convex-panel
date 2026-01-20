/**
 * Function Types
 * Types for Convex functions (queries, mutations, actions)
 */

export type UdfType = "Query" | "Mutation" | "Action" | "HttpAction";

export type Visibility = { kind: "public" } | { kind: "internal" };

export type ModuleFunction = {
  name: string;
  lineno?: number;
  udfType: UdfType;
  visibility: Visibility;
  argsValidator: string;
};

export type FunctionGroup = {
  name: string;
  functions: ModuleFunction[];
};

/**
 * Module information from function discovery
 */
export type Module = {
  functions: ModuleFunction[];
  cronSpecs?: [string, { udfPath: string; udfArgs: ArrayBuffer }][];
  sourcePackageId: string;
};

export type Modules = Map<string, Module>;
