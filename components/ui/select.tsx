"use client";

import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

const SelectRoot = BaseSelect.Root;

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof BaseSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      className,
    )}
    {...props}
  >
    {children}
    <BaseSelect.Icon className="ml-auto flex shrink-0 text-muted-foreground">
      <ChevronDown className="size-4" />
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = BaseSelect.Value;

const SelectPopup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseSelect.Popup>
>(({ className, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner
      className="z-50"
      side="bottom"
      align="start"
      sideOffset={4}
    >
      <BaseSelect.Popup
        ref={ref}
        className={cn(
          "relative min-w-[var(--anchor-width)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className,
        )}
        {...props}
      />
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
));
SelectPopup.displayName = "SelectPopup";

const SelectList = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof BaseSelect.List>
>(({ className, ...props }, ref) => (
  <BaseSelect.List
    ref={ref}
    className={cn(
      "max-h-64 overflow-auto p-1",
      className,
    )}
    {...props}
  />
));
SelectList.displayName = "SelectList";

const SelectItem = React.forwardRef<
  HTMLElement,
  React.ComponentProps<typeof BaseSelect.Item>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <BaseSelect.ItemIndicator className="mr-2 flex size-4 items-center justify-center">
      <Check className="size-3.5" />
    </BaseSelect.ItemIndicator>
    <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
  </BaseSelect.Item>
));
SelectItem.displayName = "SelectItem";

export {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
};
