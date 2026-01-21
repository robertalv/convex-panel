import { cn } from "@/lib/utils";

interface ActionButtonForHealthCardProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

export function ActionButtonForHealthCard({
    onClick,
    title,
    children,
  }: ActionButtonForHealthCardProps) {
    return (
      <button
        onClick={onClick}
        title={title}
        className={cn(
          "p-1 rounded-md border-0",
          "bg-transparent text-muted",
          "hover:bg-overlay hover:text-foreground",
          "cursor-pointer transition-all duration-150",
          "flex items-center justify-center",
        )}
      >
        {children}
      </button>
    );
  }