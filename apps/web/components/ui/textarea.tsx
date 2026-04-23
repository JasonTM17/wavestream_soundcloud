import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-0 bg-[hsl(var(--muted))] px-4 py-3 text-sm text-white shadow-[inset_0_0_0_1px_#727272] transition-colors placeholder:text-[#a7a7a7] focus-visible:shadow-[inset_0_0_0_2px_#ffffff] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

