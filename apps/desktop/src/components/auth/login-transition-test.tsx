import { useState } from "react";
import { isTauri } from "@/utils/desktop";
import { LoginTransition } from "./login-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginTransitionTestProps {
  className?: string;
}

export function LoginTransitionTest({ className }: LoginTransitionTestProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [transitionCount, setTransitionCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [transitionKey, setTransitionKey] = useState(0);

  const handleStartTransition = () => {
    setLog([]);
    const startTime = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `[${startTime}] Starting transition #${transitionCount + 1}`]);
    setLog((prev) => [...prev, `[${startTime}] Theme: ${theme}`]);
    
    setTransitionKey((prev) => prev + 1);
    setIsTransitioning(true);
    setTransitionCount((prev) => prev + 1);

    setTimeout(() => {
      setLog((prev) => [...prev, `[${startTime}] +150ms: Initial delay complete`]);
    }, 150);

    setTimeout(() => {
      if (!isTauri()) {
        setLog((prev) => [...prev, `[${startTime}] +150ms: [MOCK] expand_window() called`]);
      }
      setLog((prev) => [...prev, `[${startTime}] +200ms: Window expansion complete`]);
    }, 200);

    setTimeout(() => {
      setLog((prev) => [...prev, `[${startTime}] +250ms: Fade out started`]);
    }, 250);

    setTimeout(() => {
      setLog((prev) => [...prev, `[${startTime}] +850ms: Transition complete (expected)`]);
    }, 850);
  };

  const handleTransitionComplete = () => {
    const completeTime = new Date().toLocaleTimeString();
    setIsTransitioning(false);
    setLog((prev) => [...prev, `[${completeTime}] ✅ Transition completed callback fired`]);
  };

  const handleReset = () => {
    setIsTransitioning(false);
    setTransitionCount(0);
    setTransitionKey(0);
    setLog([]);
  };

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <div className={`min-h-screen p-8 ${className}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>LoginTransition Test Page</CardTitle>
            <CardDescription>
              Test the loading transition component with different themes and replay options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Theme:</label>
                <div className="flex gap-1">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    System
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Resolved: <span className="font-mono font-semibold">{resolvedTheme}</span>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={handleStartTransition}
                  disabled={isTransitioning}
                  variant="default"
                >
                  Start Transition
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isTransitioning}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Status</div>
                <div className="space-y-1">
                  <div>
                    Transitioning:{" "}
                    <span className={`font-mono ${isTransitioning ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                      {isTransitioning ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    Transitions Run: <span className="font-mono">{transitionCount}</span>
                  </div>
                  <div>
                    Environment:{" "}
                    <span className="font-mono">{isTauri() ? "Tauri" : "Browser (Mocked)"}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">Timing Constants</div>
                <div className="space-y-1 font-mono text-xs">
                  <div>INITIAL_DELAY: 150ms</div>
                  <div>FADE_DURATION: 600ms</div>
                  <div>Window Delay: 50ms</div>
                  <div>Total: ~800ms</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {log.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                {log.length === 0 ? (
                  <div className="text-muted-foreground">No events yet...</div>
                ) : (
                  log.map((entry, index) => (
                    <div key={index} className="text-foreground/80">
                      {entry}
                    </div>
                  ))
                )}
              </div>
              <Button
                onClick={() => setLog([])}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Clear Log
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="relative">
          <CardHeader>
            <CardTitle>Background Content</CardTitle>
            <CardDescription>This simulates the main app content that appears after transition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                When the transition is active, the LoginTransition component will render as an overlay on top of this content.
              </p>
              <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-2xl">🎉</div>
                  <div className="text-sm font-semibold">Main App Content</div>
                  <div className="text-xs text-muted-foreground">This would be your actual app UI</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isTransitioning && (
        <LoginTransition
          key={transitionKey}
          theme={theme}
          onComplete={handleTransitionComplete}
        />
      )}
    </div>
  );
}

export default LoginTransitionTest;
