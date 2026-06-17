import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300",
        className,
      )}
    >
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 leading-6 text-slate-400">{description}</p>
    </div>
  );
}
