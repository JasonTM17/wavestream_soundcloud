import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-full border-0 bg-[#1f1f1f] px-4 py-2 text-sm text-white shadow-[inset_0_0_0_1px_#727272] transition-colors placeholder:text-[#a7a7a7] focus-visible:shadow-[inset_0_0_0_2px_#ffffff] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
