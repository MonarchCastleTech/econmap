export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-3 w-48 animate-pulse rounded-full bg-white/5" />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
    </div>
  );
}
