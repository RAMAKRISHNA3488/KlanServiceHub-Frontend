import { cva } from 'class-variance-authority';
import * as React from 'react';
import { TaskStatus } from '@/features/tasks/types';
import { cn } from '@/lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-full border px-1.5 py-0.2 text-[9px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
            secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
            outline: 'text-foreground',
            [TaskStatus.TODO]: 'border-transparent bg-red-400 text-red-50 hover:bg-red-400/80',
            [TaskStatus.IN_PROGRESS]: 'border-transparent bg-yellow-400 text-yellow-50 hover:bg-yellow-400/80',
            [TaskStatus.IN_REVIEW]: 'border-transparent bg-blue-400 text-blue-50 hover:bg-blue-400/80',
            [TaskStatus.DONE]: 'border-transparent bg-emerald-400 text-emerald-50 hover:bg-emerald-400/80',
            [TaskStatus.BACKLOG]: 'border-transparent bg-pink-400 text-pink-50 hover:bg-pink-400/80',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props}/>;
}
export { Badge, badgeVariants };
