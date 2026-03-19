export default function ProblemDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded-full bg-secondary/80" />
      <div className="h-96 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="h-72 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
          <div className="h-72 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
        </div>
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
          <div className="h-64 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70" />
        </div>
      </div>
    </div>
  );
}
