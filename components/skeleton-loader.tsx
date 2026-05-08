export function TaskSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-blue-900/20 rounded-2xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-1 h-10 bg-blue-600/40 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-blue-600/40 rounded" />
              <div className="h-2 w-32 bg-blue-700/30 rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-blue-600/40 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} gap-2`}>
          {i % 2 === 0 && <div className="w-8 h-8 bg-blue-600/40 rounded-full flex-shrink-0" />}
          <div className="max-w-xs px-4 py-2 rounded-lg bg-blue-700/30 h-10 w-40" />
          {i % 2 !== 0 && <div className="w-8 h-8 bg-blue-600/40 rounded-full flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 bg-blue-900/20 rounded-lg">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-4 bg-blue-600/40 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}
