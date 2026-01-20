import { cn } from "@/lib/utils";

type CalloutVariant = "instructions" | "error" | "hint" | "localDev" | "upsell";

const classes: Record<CalloutVariant, string> = {
  error: "bg-error-subtle text-error-base",
  instructions: "bg-warning-subtle text-warning-base",
  hint: "bg-accent-subtle",
  upsell: "bg-accent-subtle",
  localDev:
    "bg-teal-100 border border-teal-500 dark:bg-teal-900 text-text-base",
};

export function Callout({
  variant = "instructions",
  children,
  className,
  ...props
}: {
  variant?: CalloutVariant;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `mt-2 flex rounded-lg p-3 text-sm ${classes[variant]}`,
        className,
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}
