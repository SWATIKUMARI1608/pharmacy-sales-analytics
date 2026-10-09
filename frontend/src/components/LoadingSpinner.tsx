interface LoadingSpinnerProps {
  rows?: number;
}

export default function LoadingSpinner({ rows = 4 }: LoadingSpinnerProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}
