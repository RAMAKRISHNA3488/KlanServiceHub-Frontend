import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (<input type={type} className={cn('flex h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-2xs transition-all duration-150 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props}/>);
});
Input.displayName = 'Input';
export { Input };
