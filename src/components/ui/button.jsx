import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:from-neutral-100 disabled:to-neutral-100 disabled:text-neutral-300 border border-neutral-300 shadow-2xs [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0', {
    variants: {
        variant: {
            primary: 'bg-gradient-to-b from-blue-600 to-blue-700 text-primary-foreground hover:from-blue-700 hover:to-blue-700 border-blue-600',
            destructive: 'bg-gradient-to-b from-amber-600 to-amber-700 text-destructive-foreground hover:from-amber-700 hover:to-amber-700 border-amber-600',
            outline: 'border border-input bg-background shadow-2xs hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-white text-neutral-800 hover:bg-neutral-50 border-neutral-300',
            ghost: 'border-transparent shadow-none hover:bg-accent hover:text-accent-foreground',
            muted: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200',
            tertiary: 'bg-blue-50 text-blue-600 border-transparent hover:bg-blue-100 shadow-none',
        },
        size: {
            default: 'h-7 px-2.5 py-1 text-[10px]',
            xs: 'h-5 rounded px-1.5 text-[8.5px]',
            sm: 'h-6 rounded px-2 text-[9px]',
            lg: 'h-8 rounded-md px-3.5 text-[11px]',
            icon: 'size-6',
        },
    },
    defaultVariants: {
        variant: 'primary',
        size: 'default',
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}/>;
});
Button.displayName = 'Button';
export { Button, buttonVariants };
