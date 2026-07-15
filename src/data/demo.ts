export type SourceStatus = "healthy" | "warning" | "paused";

export type SourceRecord = {
  id: string;
  name: string;
  domain: string;
  type: "RSS" | "Website" | "Institution";
  pillar: string;
  cadence: string;
  lastRun: string;
  items: number;
  status: SourceStatus;
};

export type TopicStage = "discovered" | "qualified" | "brief-ready" | "rejected";

export type TopicRecord = {
  id: string;
  title: string;
  source: string;
  pillar: string;
  score: number;
  freshness: number;
  authority: number;
  stage: TopicStage;
};

export const demoSources: SourceRecord[] = [
  { id: "anrt", name: "ANRT Morocco", domain: "anrt.ma", type: "Institution", pillar: "Connectivity & regulation", cadence: "Every 6 hours", lastRun: "12 min ago", items: 38, status: "healthy" },
  { id: "add", name: "Digital Development Agency", domain: "add.gov.ma", type: "Institution", pillar: "Digital public policy", cadence: "Every 12 hours", lastRun: "41 min ago", items: 24, status: "healthy" },
  { id: "mcinet", name: "Ministry of Digital Transition", domain: "mmsp.gov.ma", type: "Institution", pillar: "Government strategy", cadence: "Every 12 hours", lastRun: "1 hour ago", items: 19, status: "healthy" },
  { id: "cgem", name: "CGEM Digital Economy", domain: "cgem.ma", type: "Website", pillar: "Enterprise transformation", cadence: "Daily", lastRun: "3 hours ago", items: 31, status: "healthy" },
  { id: "datacenter", name: "Data Center Dynamics Africa", domain: "datacenterdynamics.com", type: "RSS", pillar: "Cloud & data centres", cadence: "Every 4 hours", lastRun: "18 min ago", items: 57, status: "healthy" },
  { id: "itu", name: "ITU Development", domain: "itu.int", type: "RSS", pillar: "Telecom benchmarks", cadence: "Every 8 hours", lastRun: "2 hours ago", items: 46, status: "warning" },
];

export const demoTopics: TopicRecord[] = [
  { id: "cloud-capacity", title: "Morocco expands national cloud and data-centre capacity", source: "Data Center Dynamics Africa", pillar: "Cloud infrastructure", score: 92, freshness: 95, authority: 87, stage: "qualified" },
  { id: "5g-enterprise", title: "5G deployment priorities for enterprises and public services", source: "ANRT Morocco", pillar: "Connectivity", score: 88, freshness: 91, authority: 93, stage: "brief-ready" },
  { id: "subsea-cables", title: "New subsea cable routes strengthen Morocco's digital position", source: "ITU Development", pillar: "International networks", score: 85, freshness: 86, authority: 89, stage: "qualified" },
  { id: "sovereignty", title: "Data sovereignty and cybersecurity requirements for Moroccan operators", source: "Ministry of Digital Transition", pillar: "Policy & security", score: 81, freshness: 79, authority: 94, stage: "discovered" },
  { id: "rural-connectivity", title: "Rural connectivity programmes and the next universal-service priorities", source: "ANRT Morocco", pillar: "Digital inclusion", score: 77, freshness: 82, authority: 91, stage: "discovered" },
];
