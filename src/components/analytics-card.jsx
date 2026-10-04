import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
export const AnalyticsCard = ({ title, value, variant, increaseValue }) => {
    const iconColor = variant === 'up' ? 'text-emerald-500' : 'text-red-500';
    const increaseValueColor = variant === 'up' ? 'text-emerald-500' : 'text-red-500';
    const Icon = variant === 'up' ? FaCaretUp : FaCaretDown;
    return (<Card className="w-full border-none shadow-none">
      <CardHeader className="p-3.5 space-y-1">
        <div className="flex items-center gap-x-2">
          <CardDescription className="flex items-center gap-x-1.5 overflow-hidden font-medium">
            <span className="truncate text-xs font-semibold text-neutral-500">{title}</span>
          </CardDescription>

          <div className="flex items-center gap-x-0.5">
            <Icon className={cn(iconColor, 'size-3.5')}/>
            <span className={cn(increaseValueColor, 'truncate text-xs font-semibold')}>{increaseValue}</span>
          </div>
        </div>

        <CardTitle className="text-xl font-bold text-neutral-900">{value}</CardTitle>
      </CardHeader>
    </Card>);
};
