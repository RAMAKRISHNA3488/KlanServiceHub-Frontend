import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200/80', className)}
      {...props}
    />
  );
}

export default Skeleton;
