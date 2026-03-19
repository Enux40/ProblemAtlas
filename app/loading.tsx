export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 animate-pulse rounded-full bg-secondary/80" />
      <div className="h-20 max-w-3xl animate-pulse rounded-[2rem] bg-secondary/70" />
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70"
          />
        ))}
      </div>
    </div>
  );
}
