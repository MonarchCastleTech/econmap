import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: "actual" | "estimate" | "forecast";
  className?: string;
}) {
  const palette =
    status === "actual"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : status === "estimate"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : "border-sky-400/30 bg-sky-400/10 text-sky-200";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
        palette,
        className,
      )}
    >
      {status}
    </span>
  );
}
