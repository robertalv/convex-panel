import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { Button } from "./ui/button";

export function EmailSignup() {
  const marketingSignup = useMutation(api.loops.marketingSignup);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter an email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      await marketingSignup({
        email: trimmed,
        source: "convex-panel-web-landing",
      });
      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="mt-4 w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-border bg-background-secondary/60 px-4 py-2 text-sm text-content-primary placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full px-4 py-2 text-xs sm:text-sm"
        >
          {status === "loading" ? "Signing up..." : "Get updates"}
        </Button>
      </form>
      <div className="mt-1 min-h-[1.25rem] text-xs text-[#6b7280]">
        {status === "success" && (
          <span className="text-emerald-400">
            Thanks! You&apos;re on the list for Convex Panel updates.
          </span>
        )}
        {status === "error" && error && (
          <span className="text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}


