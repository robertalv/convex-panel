import * as React from "react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CircleHelpIcon,
  CornerDownLeftIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandCreateHandle,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { EmptyMedia } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCommandPalette } from "@/contexts/command-palette-context";
import type { Command as CommandType } from "@/lib/commands";

// Mock AI response for demonstration
const MOCK_AI_RESPONSE = `To navigate through your Convex deployment efficiently, you can use the command palette (⌘K) to quickly jump to any section.

For data operations, head to the Data view where you can browse tables, filter documents, and perform CRUD operations. The Schema view provides a visual representation of your database relationships.

Functions view lets you explore all your queries, mutations, and actions with detailed statistics and logs. You can also run functions directly using the Function Runner panel (⌃1).

For debugging, use the Logs view to stream console output in real-time, or check the Health dashboard for deployment metrics and performance insights.`;

const MOCK_REFERENCE_LINKS = [
  { title: "Navigation Shortcuts", url: "#/health" },
  { title: "Data Browser", url: "#/data" },
  { title: "Function Runner", url: "#/functions" },
];

interface AIState {
  mode: boolean;
  query: string;
  submittedQuery: string;
  response: string;
  referenceLinks: Array<{ title: string; url: string }>;
  isGenerating: boolean;
  error: string | null;
}

const initialAIState: AIState = {
  mode: false,
  query: "",
  submittedQuery: "",
  response: "",
  referenceLinks: [],
  isGenerating: false,
  error: null,
};

interface CommandGroup {
  category: string;
  items: CommandType[];
}

function markdownToSafeHTML(markdown: string): string {
  // Simple markdown to HTML converter for demo purposes
  return markdown
    .split("\n\n")
    .map((para) => `<p>${para}</p>`)
    .join("");
}

export const commandHandle: ReturnType<typeof CommandCreateHandle> =
  CommandCreateHandle();

export function CommandPalette() {
  const {
    isOpen,
    close,
    filterCommands: filterCommandsFn,
  } = useCommandPalette();

  const [aiState, setAIState] = React.useState<AIState>(initialAIState);
  const [searchQuery, setSearchQuery] = React.useState("");
  const aiInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const commandResetKeyRef = React.useRef(0);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetAIState = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setAIState(initialAIState);
  }, []);

  const handleBackToSearch = React.useCallback(() => {
    resetAIState();
    setSearchQuery("");
    commandResetKeyRef.current += 1;
    setTimeout(() => searchInputRef.current?.focus(), 10);
  }, [resetAIState]);

  const handleGenerateAI = React.useCallback(
    async (queryOverride?: string) => {
      const query = queryOverride || aiState.query;
      if (!query.trim()) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setAIState((prev) => ({
        ...prev,
        error: null,
        isGenerating: true,
        query: "",
        referenceLinks: [],
        response: "",
        submittedQuery: query,
      }));

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, 1500);
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("aborted"));
          });
        });

        if (controller.signal.aborted) return;

        setAIState((prev) => ({
          ...prev,
          isGenerating: false,
          referenceLinks: MOCK_REFERENCE_LINKS,
          response: MOCK_AI_RESPONSE,
        }));
      } catch (error) {
        if (error instanceof Error && error.message === "aborted") {
          return;
        }
        if (controller.signal.aborted) return;

        setAIState((prev) => ({
          ...prev,
          error: "Failed to generate response. Please try again.",
          isGenerating: false,
        }));
      }
    },
    [aiState.query],
  );

  const handleAskAI = React.useCallback(() => {
    const currentQuery = searchQuery;
    setSearchQuery("");
    if (currentQuery.trim()) {
      setAIState((prev) => ({ ...prev, mode: true }));
      handleGenerateAI(currentQuery);
    } else {
      setAIState((prev) => ({ ...prev, mode: true, query: "" }));
      setTimeout(() => aiInputRef.current?.focus(), 10);
    }
  }, [searchQuery, handleGenerateAI]);

  // Handle Escape key in AI mode
  React.useEffect(() => {
    if (!isOpen || !aiState.mode) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleBackToSearch();
      }
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [isOpen, aiState.mode, handleBackToSearch]);

  // Auto-focus AI input
  React.useEffect(() => {
    if (aiState.mode && !aiState.isGenerating) {
      aiInputRef.current?.focus();
    }
  }, [aiState.mode, aiState.isGenerating]);

  // Get filtered commands and group them
  const filteredCommands = React.useMemo(() => {
    if (aiState.mode) return [];
    return filterCommandsFn(searchQuery);
  }, [searchQuery, filterCommandsFn, aiState.mode]);

  const commandGroups = React.useMemo(() => {
    const groups = new Map<string, CommandType[]>();
    for (const command of filteredCommands) {
      const existing = groups.get(command.category) || [];
      groups.set(command.category, [...existing, command]);
    }
    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [filteredCommands]);

  const hasResults = React.useMemo(
    () =>
      !searchQuery.trim() ||
      commandGroups.some((group) => group.items.length > 0),
    [searchQuery, commandGroups],
  );

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        close();
        setSearchQuery("");
        resetAIState();
      }
    },
    [close, resetAIState],
  );

  const handleItemClick = React.useCallback(
    (command: CommandType) => {
      command.action();
      close();
    },
    [close],
  );

  return (
    <CommandDialog
      handle={commandHandle}
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      <CommandDialogPopup>
        {!aiState.mode ? (
          <Command key={commandResetKeyRef.current} shouldFilter={false}>
            <div className="relative flex items-center border-b border-border-muted *:first:flex-1">
              <CommandInput
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    handleAskAI();
                  }
                  if (e.key === "Enter" && !hasResults && searchQuery.trim()) {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
                placeholder="Type a command or search..."
                ref={searchInputRef}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <Button
                className="me-3 rounded-md text-text-subtle hover:text-text-base hover:bg-surface-raised text-sm transition-colors"
                onClick={handleAskAI}
                size="sm"
                variant="ghost"
              >
                <SparklesIcon className="size-4" />
                Ask AI
                <Kbd className="-me-1 ms-1">Tab</Kbd>
              </Button>
            </div>
            <CommandPanel>
              <CommandEmpty className="py-12">
                {searchQuery.trim() && (
                  <div className="flex flex-col items-center gap-3">
                    <EmptyMedia variant="icon">
                      <SearchIcon />
                    </EmptyMedia>
                    <div className="text-center">
                      <p className="text-text-muted mb-2">No results found.</p>
                      <p className="text-text-subtle text-xs">
                        Press <Kbd className="inline-flex mx-1">Enter</Kbd> to
                        ask AI about:{" "}
                        <strong className="text-text-base font-medium">
                          {searchQuery}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}
              </CommandEmpty>
              <CommandList>
                {commandGroups.map((group: CommandGroup, index: number) => (
                  <React.Fragment key={group.category}>
                    <CommandGroup>
                      <CommandGroupLabel>{group.category}</CommandGroupLabel>
                      {group.items.map((item: CommandType) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleItemClick(item)}
                          value={item.id}
                        >
                          <div className="flex flex-col flex-1 gap-0.5">
                            <span className="font-medium">{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-text-subtle">
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.shortcut && (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {index < commandGroups.length - 1 && <CommandSeparator />}
                  </React.Fragment>
                ))}
              </CommandList>
            </CommandPanel>
            <CommandFooter>
              {hasResults ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <KbdGroup>
                        <Kbd>
                          <ArrowUpIcon className="size-3" />
                        </Kbd>
                        <Kbd>
                          <ArrowDownIcon className="size-3" />
                        </Kbd>
                      </KbdGroup>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Kbd>
                        <CornerDownLeftIcon className="size-3" />
                      </Kbd>
                      <span>Open</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Kbd>Esc</Kbd>
                    <span>Close</span>
                  </div>
                </>
              ) : (
                <div className="ms-auto flex items-center gap-2">
                  <Kbd>Esc</Kbd>
                  <span>Close</span>
                </div>
              )}
            </CommandFooter>
          </Command>
        ) : (
          <Command>
            <div className="flex items-center *:first:flex-1">
              <div className="px-2.5 py-1.5">
                <div className="relative w-full">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3 text-brand-base"
                    data-slot="autocomplete-start-addon"
                  >
                    <SparklesIcon className="size-4" />
                  </div>
                  <Input
                    aria-label="AI query input"
                    className="border-transparent bg-transparent shadow-none pl-10 text-base text-text-base placeholder:text-text-disabled focus:outline-none focus:ring-0 focus:border-none focus:shadow-none active:outline-none active:ring-0 active:border-none active:shadow-none hover:outline-none hover:ring-0 hover:border-none hover:shadow-none"
                    disabled={aiState.isGenerating}
                    onChange={(e) =>
                      setAIState((prev) => ({
                        ...prev,
                        query: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !aiState.isGenerating) {
                        handleGenerateAI();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleBackToSearch();
                      }
                    }}
                    placeholder="Ask AI anything…"
                    ref={aiInputRef}
                    value={aiState.query}
                    style={{
                      outline: "none",
                      boxShadow: "none",
                      border: "none",
                    }}
                  />
                </div>
              </div>
              <Button
                className="me-3 rounded-md text-text-subtle hover:text-text-base hover:bg-surface-raised text-sm transition-colors"
                onClick={handleBackToSearch}
                size="sm"
                variant="ghost"
              >
                <ArrowLeftIcon className="size-4" />
                Back to search
                <Kbd className="-me-1 ms-1">Esc</Kbd>
              </Button>
            </div>
            <CommandPanel>
              <ScrollArea>
                <div className="p-6">
                  {!aiState.isGenerating &&
                    !aiState.response &&
                    !aiState.error && (
                      <div className="flex items-center justify-center py-16">
                        <p className="text-text-muted text-sm">
                          Ask AI anything and press{" "}
                          <Kbd className="inline-flex mx-1">Enter</Kbd> to get
                          started.
                        </p>
                      </div>
                    )}
                  {aiState.error && (
                    <div
                      aria-live="polite"
                      className="text-error-base text-sm p-4 bg-error-muted rounded-md"
                      role="alert"
                    >
                      {aiState.error}
                    </div>
                  )}
                  {aiState.isGenerating && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-1/2 bg-surface-raised" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-3/4 bg-surface-raised" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-full bg-surface-raised" />
                        <Skeleton className="h-4 w-3/5 bg-surface-raised" />
                      </div>
                    </div>
                  )}
                  {aiState.response && !aiState.isGenerating && (
                    <>
                      <div
                        aria-live="polite"
                        className="text-text-muted text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-text-base [&_strong]:font-medium [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_a]:text-brand-base [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-brand-hover"
                        dangerouslySetInnerHTML={{
                          __html: markdownToSafeHTML(aiState.response),
                        }}
                      />
                      {aiState.referenceLinks.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {aiState.referenceLinks.map((link, index) => (
                            <Button
                              key={`${link.url}-${index}`}
                              onClick={() => {
                                window.location.hash = link.url;
                                close();
                              }}
                              size="sm"
                              variant="secondary"
                              className="text-xs"
                            >
                              {link.title}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </CommandPanel>
            <CommandFooter>
              {aiState.isGenerating ? (
                <div aria-live="polite" className="flex items-center gap-2">
                  <div className="flex h-5 items-center justify-center">
                    <Spinner className="size-3 text-brand-base" />
                  </div>
                  <span className="animate-pulse text-text-muted">
                    Generating response…
                  </span>
                </div>
              ) : aiState.response ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <div className="flex h-5 items-center justify-center">
                    <CircleHelpIcon className="size-3" />
                  </div>
                  <span>
                    You asked:{" "}
                    <span className="text-text-base">
                      &quot;{aiState.submittedQuery}&quot;
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Kbd>
                    <CornerDownLeftIcon className="size-3" />
                  </Kbd>
                  <span>Ask AI</span>
                </div>
              )}
            </CommandFooter>
          </Command>
        )}
      </CommandDialogPopup>
    </CommandDialog>
  );
}

export default CommandPalette;
