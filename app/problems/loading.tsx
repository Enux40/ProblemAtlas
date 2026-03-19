export default function ProblemsLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="h-[32rem] animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
      <div className="space-y-5">
        <div className="h-28 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70"
          />
        ))}
      </div>
    </div>
  );
}
