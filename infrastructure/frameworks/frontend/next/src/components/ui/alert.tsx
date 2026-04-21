import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "group/alert grid w-full grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1 rounded-lg border px-3 py-3 text-left text-sm",
    "[&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:row-span-2 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-current",
    "[&_[data-slot=alert-title]]:col-start-2 [&_[data-slot=alert-title]]:row-start-1 [&_[data-slot=alert-title]]:min-w-0",
    "[&_[data-slot=alert-description]]:col-start-2 [&_[data-slot=alert-description]]:row-start-2 [&_[data-slot=alert-description]]:min-w-0",
    "has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18",
  ],
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-action" className={cn(className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
