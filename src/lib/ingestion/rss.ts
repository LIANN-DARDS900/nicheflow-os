import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const feedUrlSchema = z.string().url().max(2048);
const MAX_FEED_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;

export type NormalizedFeedItem = {
  externalId: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  author: string | null;
};

export type NormalizedFeed = {
  title: string;
  siteUrl: string | null;
  feedUrl: string;
  items: NormalizedFeedItem[];
};

type XmlRecord = Record<string, unknown>;

function asRecord(value: unknown): XmlRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as XmlRecord : null;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  const record = asRecord(value);
  if (!record) return "";
  return asText(record["#text"] ?? record["__cdata"] ?? record["@_href"] ?? "");
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function stripHtml(value: string): string {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isPrivateIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a >= 224);
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb");
  }
  return true;
}

async function assertPublicUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(feedUrlSchema.parse(rawUrl));
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS feed URLs are allowed.");
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local") || isPrivateIp(hostname)) throw new Error("Private network feed URLs are not allowed.");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error("Feed hostname resolves to a private or invalid address.");
  return parsed;
}

async function fetchFeedResponse(rawUrl: string): Promise<Response> {
  let current = await assertPublicUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "NicheFlowOS/0.1 (+https://github.com/LIANN-DARDS900/nicheflow-os)", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("Feed redirect limit exceeded.");
      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Feed request failed with status ${response.status}.`);
    return response;
  }
  throw new Error("Unable to fetch feed.");
}

function normalizeRss(root: XmlRecord, feedUrl: string): NormalizedFeed | null {
  const channel = asRecord(asRecord(root.rss)?.channel);
  if (!channel) return null;
  const items = asArray(channel.item).map(asRecord).filter((item): item is XmlRecord => Boolean(item)).map((item, index) => {
    const url = firstNonEmpty(item.link, asRecord(item.guid)?.["#text"], item.guid);
    const title = firstNonEmpty(item.title, "Untitled source item");
    const id = firstNonEmpty(item.guid, url, `${title}-${index}`);
    return {
      externalId: id,
      title,
      url,
      summary: stripHtml(firstNonEmpty(item.description, item["content:encoded"])),
      publishedAt: firstNonEmpty(item.pubDate, item["dc:date"]) || null,
      author: firstNonEmpty(item.author, item["dc:creator"]) || null,
    };
  });
  return { title: firstNonEmpty(channel.title, new URL(feedUrl).hostname), siteUrl: firstNonEmpty(channel.link) || null, feedUrl, items };
}

function atomLink(value: unknown): string {
  const links = asArray(value).map(asRecord).filter((link): link is XmlRecord => Boolean(link));
  const alternate = links.find((link) => !link["@_rel"] || link["@_rel"] === "alternate");
  return asText(alternate?.["@_href"] ?? links[0]?.["@_href"] ?? value);
}

function normalizeAtom(root: XmlRecord, feedUrl: string): NormalizedFeed | null {
  const feed = asRecord(root.feed);
  if (!feed) return null;
  const items = asArray(feed.entry).map(asRecord).filter((item): item is XmlRecord => Boolean(item)).map((item, index) => {
    const url = atomLink(item.link);
    const title = firstNonEmpty(item.title, "Untitled source item");
    return {
      externalId: firstNonEmpty(item.id, url, `${title}-${index}`),
      title,
      url,
      summary: stripHtml(firstNonEmpty(item.summary, item.content)),
      publishedAt: firstNonEmpty(item.published, item.updated) || null,
      author: firstNonEmpty(asRecord(item.author)?.name, item.author) || null,
    };
  });
  return { title: firstNonEmpty(feed.title, new URL(feedUrl).hostname), siteUrl: atomLink(feed.link) || null, feedUrl, items };
}

export async function ingestFeed(rawUrl: string): Promise<NormalizedFeed> {
  const response = await fetchFeedResponse(rawUrl);
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_FEED_BYTES) throw new Error("Feed is larger than the allowed limit.");
  const xml = await response.text();
  if (Buffer.byteLength(xml, "utf8") > MAX_FEED_BYTES) throw new Error("Feed is larger than the allowed limit.");
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true, processEntities: false });
  const root = asRecord(parser.parse(xml));
  if (!root) throw new Error("Feed XML is invalid.");
  const normalized = normalizeRss(root, response.url || rawUrl) ?? normalizeAtom(root, response.url || rawUrl);
  if (!normalized) throw new Error("The URL does not contain a supported RSS or Atom feed.");
  return { ...normalized, items: normalized.items.filter((item) => item.title && item.url).slice(0, 100) };
}
