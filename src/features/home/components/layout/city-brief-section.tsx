type CityBriefSectionRow = {
  label: string;
  sourceLabel?: string;
  value: string;
};

type CityBriefSectionProps = {
  rows: CityBriefSectionRow[];
  title: string;
};

export function CityBriefSection({ rows, title }: CityBriefSectionProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="border border-[#272c29] bg-[#0f1112] px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{row.label}</p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-white">{row.value}</p>
            {row.sourceLabel ? (
              <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#a7b47f]">{row.sourceLabel}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
