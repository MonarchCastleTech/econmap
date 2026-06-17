export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
      <p className="text-base font-semibold text-rose-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-rose-200/80">{description}</p>
    </div>
  );
}
