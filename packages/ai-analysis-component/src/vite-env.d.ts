interface ImportMeta {
  glob<Module = { [key: string]: any }>(
    pattern: string,
    options?: { eager?: boolean; import?: string; query?: string | Record<string, string | number | boolean> }
  ): Record<string, () => Promise<Module>> | Record<string, Module>;
}








