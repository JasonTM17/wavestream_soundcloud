import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1ed760] text-black",
        secondary: "border-transparent bg-[#1f1f1f] text-white",
        outline: "border-[#4d4d4d] bg-transparent text-[#b3b3b3]",
        soft: "border-transparent bg-[#1ed760]/15 text-[#1ed760]",
        success: "border-transparent bg-[#1ed760]/15 text-[#1ed760]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
