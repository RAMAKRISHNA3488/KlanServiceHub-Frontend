import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (<input type={type} className={cn('flex h-7 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-[10px] text-neutral-800 shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-[10px] file:font-medium file:text-foreground placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props}/>);
});
Input.displayName = 'Input';
export { Input };
