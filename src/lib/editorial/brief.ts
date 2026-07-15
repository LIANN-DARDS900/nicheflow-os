export type BriefSourceInput = {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  pillar: string | null;
};

export type EditorialBrief = {
  title: string;
  objective: string;
  audience: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  outline: { heading: string; guidance: string }[];
  sourceReferences: { title: string; url: string; source: string }[];
};

function normalizeWords(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function primaryKeyword(title: string, pillar: string | null): string {
  const titleWords = normalizeWords(title);
  const anchors = ["morocco", "maroc", "5g", "cloud", "datacenter", "data", "telecom", "cybersecurity", "infrastructure", "digital"];
  const selected = titleWords.filter((word) => anchors.includes(word)).slice(0, 4);
  if (selected.length >= 2) return selected.join(" ");
  const pillarWords = normalizeWords(pillar ?? "digital infrastructure morocco").slice(0, 3);
  return [...selected, ...pillarWords].slice(0, 4).join(" ") || "digital infrastructure morocco";
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function buildEditorialBrief(input: BriefSourceInput): EditorialBrief {
  const keyword = primaryKeyword(input.title, input.pillar);
  const pillar = input.pillar ?? "Digital infrastructure";
  const secondaryKeywords = Array.from(new Set([
    `${pillar.toLowerCase()} Morocco`,
    "digital transformation Morocco",
    "technology infrastructure Morocco",
  ])).filter((value) => value !== keyword);

  return {
    title: input.title,
    objective: `Explain the development, its operational significance, and the practical implications for organizations involved in Morocco's digital infrastructure ecosystem.`,
    audience: "Technology leaders, infrastructure operators, public-sector decision makers, investors and specialist business readers in Morocco.",
    primaryKeyword: keyword,
    secondaryKeywords,
    searchIntent: "informational",
    outline: [
      { heading: "Executive context", guidance: "Summarize the development and establish why it matters now without exaggeration." },
      { heading: "What has changed", guidance: `Describe the verified facts from ${input.sourceName} and separate announcements from confirmed implementation.` },
      { heading: `Impact on ${pillar.toLowerCase()}`, guidance: "Analyze capacity, resilience, regulation, cost, adoption or competitiveness where relevant." },
      { heading: "Who is affected", guidance: "Identify operators, enterprises, public institutions, investors and end users affected by the change." },
      { heading: "Risks and open questions", guidance: "Surface dependencies, timelines, policy uncertainty, security concerns and missing evidence." },
      { heading: "What to watch next", guidance: "Give concrete milestones and signals readers can monitor after publication." },
    ],
    sourceReferences: [{ title: input.title, url: input.url, source: input.sourceName }],
  };
}
