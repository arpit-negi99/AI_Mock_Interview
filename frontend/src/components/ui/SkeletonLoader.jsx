export function SkeletonLoader({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 rounded-xl animate-shimmer"
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </div>
  );
}
