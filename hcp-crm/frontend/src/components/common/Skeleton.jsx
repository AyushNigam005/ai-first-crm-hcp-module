export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-3 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  )
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}
