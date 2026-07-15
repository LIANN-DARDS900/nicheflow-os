export type TopicScoringInput = {
  title: string;
  summary: string;
  publishedAt: string | null;
  sourceType: string;
  coveragePillar: string | null;
};

export type TopicScoringResult = {
  relevance: number;
  freshness: number;
  authority: number;
  total: number;
  matchedTerms: string[];
  rationale: {
    geographicMatch: boolean;
    titleMatches: number;
    summaryMatches: number;
    sourceType: string;
    coveragePillar: string | null;
  };
};

const nicheTerms = [
  "5g",
  "cloud",
  "data center",
  "data centre",
  "datacenter",
  "telecom",
  "fiber",
  "fibre",
  "broadband",
  "connectivity",
  "cybersecurity",
  "cyber security",
  "cybersecurite",
  "data sovereignty",
  "souverainete des donnees",
  "digital transformation",
  "transformation digitale",
  "digital infrastructure",
  "infrastructure numerique",
  "subsea cable",
  "undersea cable",
  "cable sous marin",
  "network",
  "reseau",
  "artificial intelligence infrastructure",
  "edge computing",
  "internet exchange",
];

const geographicTerms = ["morocco", "maroc", "moroccan", "marocaine", "marocain", "casablanca", "rabat", "tanger", "tangier"];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueMatches(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(normalize(term)));
}

function freshnessScore(publishedAt: string | null, now: Date): number {
  if (!publishedAt) return 45;
  const timestamp = new Date(publishedAt).getTime();
  if (!Number.isFinite(timestamp)) return 45;
  const ageHours = Math.max(0, (now.getTime() - timestamp) / 3_600_000);
  if (ageHours <= 24) return 100;
  if (ageHours <= 72) return 92;
  if (ageHours <= 168) return 82;
  if (ageHours <= 336) return 68;
  if (ageHours <= 720) return 55;
  if (ageHours <= 2160) return 38;
  return 20;
}

function authorityScore(sourceType: string): number {
  if (sourceType === "manual") return 70;
  if (sourceType === "rss" || sourceType === "atom") return 82;
  if (sourceType === "sitemap") return 76;
  return 72;
}

export function scoreTopic(input: TopicScoringInput, now = new Date()): TopicScoringResult {
  const title = normalize(input.title);
  const summary = normalize(input.summary);
  const pillar = normalize(input.coveragePillar ?? "");
  const titleMatches = uniqueMatches(title, nicheTerms);
  const summaryMatches = uniqueMatches(summary, nicheTerms).filter((term) => !titleMatches.includes(term));
  const pillarMatches = uniqueMatches(pillar, nicheTerms).filter((term) => !titleMatches.includes(term) && !summaryMatches.includes(term));
  const geographicMatch = geographicTerms.some((term) => title.includes(term) || summary.includes(term));
  const matchedTerms = [...titleMatches, ...summaryMatches, ...pillarMatches];

  const relevance = clamp(
    18 +
      Math.min(42, titleMatches.length * 14) +
      Math.min(24, summaryMatches.length * 6) +
      Math.min(8, pillarMatches.length * 4) +
      (geographicMatch ? 18 : 0),
  );
  const freshness = freshnessScore(input.publishedAt, now);
  const authority = authorityScore(input.sourceType);
  const total = clamp(relevance * 0.58 + freshness * 0.24 + authority * 0.18);

  return {
    relevance,
    freshness,
    authority,
    total,
    matchedTerms,
    rationale: {
      geographicMatch,
      titleMatches: titleMatches.length,
      summaryMatches: summaryMatches.length,
      sourceType: input.sourceType,
      coveragePillar: input.coveragePillar,
    },
  };
}
