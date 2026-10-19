import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <div className="h-12 border-b border-border bg-card px-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[42%] border-r border-border p-5 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
