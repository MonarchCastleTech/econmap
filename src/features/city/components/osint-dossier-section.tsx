import type { ReactNode } from "react";

type OsintDossierSectionProps = {
  id?: string;
  title: string;
  description: string;
  countLabel?: string;
  children: ReactNode;
};

export function OsintDossierSection({
  id,
  title,
  description,
  countLabel,
  children,
}: OsintDossierSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] p-5 shadow-[0_24px_60px_rgba(2,8,23,0.35)]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {countLabel ? (
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-50">
            {countLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
