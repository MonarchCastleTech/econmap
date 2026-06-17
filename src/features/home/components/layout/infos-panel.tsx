type InfosPanelMetric = {
  label: string;
  value: string;
};

export type InfosPanelProps = {
  adminBadge: string;
  cityMeta: string;
  cityName: string;
  flagEmoji: string;
  metrics: InfosPanelMetric[];
  sourceLabels: string[];
  summary?: string;
};

export function InfosPanel({
  adminBadge,
  cityMeta,
  cityName,
  flagEmoji,
  metrics,
  sourceLabels,
  summary,
}: InfosPanelProps) {
  return (
    <section
      data-testid="infos-panel"
      className="tactical-panel tactical-panel-strong mt-2 w-[272px] border-[#31362f] bg-[#101313]/96 p-3 font-sans"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a7b47f]">Infos</p>
          <p className="mt-1 text-[18px] font-semibold leading-none text-white">{cityName}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">{cityMeta}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none" aria-hidden="true">
            {flagEmoji}
          </span>
          <span className="tactical-chip tactical-chip-active min-w-[2.6rem] justify-center px-2 py-1 text-[10px]">
            {adminBadge}
          </span>
        </div>
      </div>

      {summary ? <p className="mt-3 text-[12px] leading-5 text-slate-400">{summary}</p> : null}

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {metrics.map((metric) => (
          <div key={metric.label} className="border border-[#272c29] bg-[#0f1112] px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      {sourceLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {sourceLabels.slice(0, 5).map((sourceLabel) => (
            <span
              key={`info-${sourceLabel}`}
              className="tactical-chip tactical-chip-active px-1.5 py-0.5 text-[9px]"
            >
              {sourceLabel}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
