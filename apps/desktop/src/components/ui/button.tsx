import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipWithKeybind,
} from "@/components/ui/tooltip";
import { Icon, IconSvgElement } from "@/components/ui/icon";


const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base focus-visible:ring-offset-2 focus-visible:ring-offset-background-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-brand-base text-white",
          "hover:bg-brand-hover",
          "active:bg-brand-base",
          "shadow-sm",
        ],
        secondary: [
          "bg-surface-raised text-text-base",
          "border border-border-base",
          "hover:bg-surface-overlay hover:border-border-strong",
          "active:bg-surface-base",
        ],
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-surface-raised",
          "active:bg-surface-base",
        ],
        outline: [
          "bg-transparent text-text-base",
          "border border-border-base",
          "hover:bg-surface-raised hover:border-border-strong",
          "active:bg-surface-base",
        ],
        destructive: [
          "bg-error-base text-white",
          "hover:bg-error-base/90",
          "active:bg-error-base",
        ],
        link: [
          "bg-transparent text-brand-base underline-offset-4",
          "hover:underline",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipKeybind?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      tooltip,
      tooltipSide = "top",
      tooltipKeybind,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );

    if (tooltip) {
      if (tooltipKeybind) {
        return (
          <TooltipWithKeybind
            content={tooltip}
            keybind={tooltipKeybind}
            side={tooltipSide}
          >
            {button}
          </TooltipWithKeybind>
        );
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  },
);
Button.displayName = "Button";

const iconButtonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center relative",
    "rounded-lg",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base focus-visible:ring-offset-2 focus-visible:ring-offset-background-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-base text-white",
          "hover:bg-brand-hover",
          "active:bg-brand-base",
          "shadow-sm",
        ],
        secondary: [
          "bg-surface-raised text-text-base",
          "border border-border-base",
          "hover:bg-surface-overlay hover:border-border-strong",
          "active:bg-surface-base",
        ],
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-surface-raised hover:text-text-base",
          "active:bg-surface-base",
        ],
        outline: [
          "bg-transparent text-text-base",
          "border border-border-base",
          "hover:bg-surface-raised hover:border-border-strong",
          "active:bg-surface-base",
        ],
        destructive: [
          "bg-error-base text-white",
          "hover:bg-error-base/90",
          "active:bg-error-base",
        ],
        topbar: [
          "text-text-muted",
          "hover:text-text-base hover:bg-surface-raised",
        ],
      },
      size: {
        xs: "w-5 h-5",
        sm: "w-6 h-6",
        md: "w-7 h-7",
        default: "w-8 h-8",
        lg: "w-10 h-10",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "topbar",
        active: true,
        class: ["bg-brand-base/10 text-brand-base"],
      },
    ],
    defaultVariants: {
      variant: "ghost",
      size: "default",
      active: false,
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean;
  icon?: string | IconSvgElement;
  iconSize?: number;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipKeybind?: string;
  active?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      active,
      asChild = false,
      icon,
      iconSize,
      tooltip,
      tooltipSide = "top",
      tooltipKeybind,
      children,
      ...props
    },
    ref,
  ) => {
    const calculatedIconSize = React.useMemo(() => {
      if (iconSize !== undefined) return iconSize;
      switch (size) {
        case "xs":
          return 16;
        case "sm":
          return 18;
        case "md":
          return 20;
        case "lg":
          return 24;
        case "default":
        default:
          return 20;
      }
    }, [iconSize, size]);

    const Comp = asChild ? Slot : "button";
    
    const content = icon ? (
      typeof icon === "string" ? (
        <Icon name={icon} size={calculatedIconSize} />
      ) : (
        <Icon icon={icon} size={calculatedIconSize} />
      )
    ) : (
      children
    );

    const button = (
      <Comp
        className={cn(iconButtonVariants({ variant, size, active, className }))}
        ref={ref}
        {...props}
      >
        {content}
      </Comp>
    );

    if (tooltip) {
      if (tooltipKeybind) {
        return (
          <TooltipWithKeybind
            content={tooltip}
            keybind={tooltipKeybind}
            side={tooltipSide}
          >
            {button}
          </TooltipWithKeybind>
        );
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  },
);
IconButton.displayName = "IconButton";

const toolbarButtonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-1",
    "h-7 px-2 rounded-lg text-xs font-medium",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base focus-visible:ring-offset-2 focus-visible:ring-offset-background-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-transparent text-text-muted",
          "border border-border-base",
          "hover:bg-surface-raised hover:text-text-base",
          "active:bg-surface-base",
        ],
        primary: [
          "bg-brand-base text-white",
          "hover:bg-brand-hover",
          "active:bg-brand-base",
          "shadow-sm",
        ],
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-surface-raised hover:text-text-base",
          "active:bg-interactive-muted",
          "border-none",
        ],
        destructive: [
          "bg-error-base-alpha/50 text-error-base",
          "border border-error-base/50",
          "hover:bg-error-base-alpha/80",
          "active:bg-error-base-alpha/80",
        ],
      },
      active: {
        true: [
          "bg-brand-base-alpha text-brand-base",
          "border-brand-base",
        ],
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        active: true,
        class: [
          "bg-brand-base-alpha text-brand-base",
          "border-brand-base/50",
        ],
      },
    ],
    defaultVariants: {
      variant: "default",
      active: false,
    },
  },
);

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toolbarButtonVariants> {
  asChild?: boolean;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipKeybind?: string;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      className,
      variant,
      active,
      asChild = false,
      tooltip,
      tooltipSide = "top",
      tooltipKeybind,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const button = (
      <Comp
        className={cn(toolbarButtonVariants({ variant, active, className }))}
        ref={ref}
        {...props}
      />
    );

    if (tooltip) {
      if (tooltipKeybind) {
        return (
          <TooltipWithKeybind
            content={tooltip}
            keybind={tooltipKeybind}
            side={tooltipSide}
          >
            {button}
          </TooltipWithKeybind>
        );
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  },
);
ToolbarButton.displayName = "ToolbarButton";

export { Button, buttonVariants, IconButton, iconButtonVariants, ToolbarButton, toolbarButtonVariants };
