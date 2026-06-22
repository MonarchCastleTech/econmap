import type { Metadata } from "next";
import { Suspense } from "react";

import { OsintCompare } from "@/features/osint/components/osint-compare";

export const metadata: Metadata = {
  title: "OSINT Compare — MapFactbook",
  description: "Compare up to three cities' source-backed coverage and entity profiles side by side.",
};

export default function OsintCompareRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
          Loading compare…
        </div>
      }
    >
      <OsintCompare />
    </Suspense>
  );
}
