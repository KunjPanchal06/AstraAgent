// ════════════════════════════════════════════════════════════════
// FILE: components/agent/skeletons.jsx
// PURPOSE: Loading skeleton placeholders for UI elements to improve
//          perceived performance during data fetching.
// EXPORTS: ChatMessageSkeleton, ToolCardSkeleton, MemorySkeleton
// DEPENDS ON: ui/skeleton
// ════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
export function Skeleton({
  className
}) {
  return <div className={cn('shimmer rounded-md', className)} />;
}
export function TrajectorySkeleton() {
  return <div className="space-y-3 p-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-2 pt-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>)}
      </div>
    </div>;
}