type InsightRequest = {
  subject: string;
  prompt: string;
  evidence: string[];
};

export async function runMockInsight(request: InsightRequest) {
  return {
    title: `MapFactbook insight: ${request.subject}`,
    summary: `${request.subject} is summarized using seeded internal data only. ${request.prompt}`,
    citations: request.evidence.map((item, index) => ({
      id: `${request.subject}-${index + 1}`,
      label: item,
    })),
  };
}
