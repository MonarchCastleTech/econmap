type SourceBadgeProps = {
  source: {
    id: string;
    name: string;
    updatedAt: string;
    coverage: string;
    methodology: string;
    url?: string;
  };
  compact?: boolean;
  showTooltip?: boolean;
};

export function SourceBadge({ source, compact = false, showTooltip = true }: SourceBadgeProps) {
  const title = showTooltip
    ? `Source: ${source.name} | Coverage: ${source.coverage} | Updated: ${source.updatedAt} | ${source.methodology}`
    : undefined;

  if (compact) {
    const className =
      "group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-[var(--signal)]/50 hover:bg-[var(--signal)]/[0.08] hover:text-white";
    const inner = (
      <>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal)]/70 transition-colors group-hover:bg-[var(--signal)]" />
        <span className="truncate">{source.name}</span>
      </>
    );

    if (source.url) {
      return (
        <a href={source.url} target="_blank" rel="noreferrer" className={className} title={title}>
          {inner}
        </a>
      );
    }
    return (
      <span className={className} title={title}>
        {inner}
      </span>
    );
  }

  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal)]/80" />
        <p className="source-label text-slate-400">
          Source <span className="mono-readout font-semibold text-slate-100">{source.name}</span>
        </p>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-400">{source.methodology}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">
        {source.coverage} · upd {source.updatedAt}
      </p>
    </>
  );

  const shell =
    "block rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors [border-left:2px_solid_var(--signal)] [border-left-color:color-mix(in_srgb,var(--signal)_55%,transparent)]";

  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className={`${shell} hover:border-white/20 hover:bg-white/[0.06]`}
        title={title}
      >
        {content}
      </a>
    );
  }

  return <div className={shell}>{content}</div>;
}
