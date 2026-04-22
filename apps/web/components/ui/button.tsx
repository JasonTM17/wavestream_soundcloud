import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold tracking-normal transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-[busy=true]:pointer-events-none aria-[busy=true]:opacity-75",
  {
    variants: {
      variant: {
        default:
          "bg-[#1ed760] text-black shadow-[0_8px_24px_-12px_rgba(30,215,96,0.6)] hover:bg-[#1fdf64] hover:scale-[1.02] hover:shadow-[0_8px_28px_-8px_rgba(30,215,96,0.65)]",
        secondary:
          "bg-[#1f1f1f] text-white border border-transparent hover:bg-[#282828] hover:scale-[1.02]",
        outline:
          "border border-[#727272] bg-transparent text-white hover:border-white hover:scale-[1.02]",
        ghost:
          "bg-transparent text-[#b3b3b3] hover:bg-[#1f1f1f] hover:text-white",
        accent:
          "bg-white text-black font-bold hover:scale-[1.02] hover:bg-[#f0f0f0]",
      },
      size: {
        default: "h-10 px-8 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
