import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold tracking-normal transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-[busy=true]:pointer-events-none aria-[busy=true]:opacity-75',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.5)] hover:bg-primary/90 hover:scale-[1.02] hover:shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.55)]',
        secondary:
          'border border-border bg-muted text-foreground hover:bg-accent hover:scale-[1.02]',
        outline:
          'border border-border bg-transparent text-foreground hover:border-primary hover:bg-muted/50 hover:scale-[1.02]',
        ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
        accent:
          'bg-primary text-primary-foreground font-bold hover:scale-[1.02] hover:bg-primary/90',
      },
      size: {
        default: 'h-10 px-8 py-2',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
