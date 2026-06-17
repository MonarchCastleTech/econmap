import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";

export default function NotFound() {
  return (
    <PageFrame
      eyebrow="Not found"
      title="Requested page is outside current coverage"
      description="The route exists in the architecture, but the specific entity was not found in the current data coverage."
    >
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-sm text-slate-300">
        Return to the <Link href="/" className="text-cyan-300">world map</Link> to select a covered country or region.
      </div>
    </PageFrame>
  );
}
