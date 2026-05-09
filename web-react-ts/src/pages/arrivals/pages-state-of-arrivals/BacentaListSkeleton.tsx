import { Skeleton } from 'components/ui/skeleton'

const RowSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
    <Skeleton className="size-12 shrink-0 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="size-9 shrink-0 rounded-md" />
  </div>
)

const CardSkeleton = () => (
  <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex flex-1 flex-col items-center gap-3 p-4">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex w-full flex-col items-center gap-1.5">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
    <div className="flex gap-2 border-t border-border px-3 py-3">
      <Skeleton className="h-9 flex-1 rounded-md" />
      <Skeleton className="h-9 flex-1 rounded-md" />
    </div>
  </div>
)

const BacentaListSkeleton = () => (
  <>
    <div className="md:hidden space-y-3">
      {[0, 1, 2].map((i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
    <div className="hidden md:grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </>
)

export default BacentaListSkeleton
