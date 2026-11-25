import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:from-neutral-100 disabled:to-neutral-100 disabled:text-neutral-400 border border-neutral-200/90 shadow-2xs active:scale-[0.98] select-none cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0', {
    variants: {
        variant: {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-xs',
            destructive: 'bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-xs',
            outline: 'border border-neutral-300 bg-white text-neutral-800 shadow-2xs hover:bg-neutral-50 hover:text-neutral-900',
            secondary: 'bg-white text-neutral-800 hover:bg-neutral-50 border-neutral-300 shadow-2xs',
            ghost: 'border-transparent shadow-none hover:bg-neutral-100 hover:text-neutral-900',
            muted: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200',
            tertiary: 'bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100 shadow-none',
        },
        size: {
            default: 'h-9 px-3.5 py-1.5 text-sm',
            xs: 'h-6 rounded-md px-2 text-xs',
            sm: 'h-7.5 rounded-md px-2.5 text-xs',
            lg: 'h-10 rounded-lg px-4 text-sm',
            icon: 'size-9 rounded-lg',
        },
    },
    defaultVariants: {
        variant: 'primary',
        size: 'default',
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';
export { Button, buttonVariants };
