import { PageFrame } from "@/components/layout/page-frame";

const stories = [
  {
    title: "Inflation disinflation arc",
    body: "Track the seeded shift from post-shock inflation to slower price growth while policy rates remain restrictive.",
  },
  {
    title: "Trade dependence under scrutiny",
    body: "Compare how export concentration and bilateral trade flows shape resilience across the showcase markets.",
  },
  {
    title: "Regional inequality inside large economies",
    body: "Use ADM1 coverage in the United States, Germany, India, and Brazil to compare scale, income, and infrastructure gaps.",
  },
  {
    title: "Energy transition divergence",
    body: "Contrast hydrocarbon-heavy exporters with mature renewable adopters using the seeded sustainability layer.",
  },
];

export function StoryModePage() {
  return (
    <PageFrame
      eyebrow="Story mode"
      title="Curated economic narratives"
      description="Internal story cards blend seeded metrics, forecasts, and annotations without relying on current news feeds."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {stories.map((story, index) => (
          <article key={story.title} className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Story {index + 1}</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{story.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{story.body}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}
