export type ExportDocument = {
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
};

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character] ?? character);
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdownBodyToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let listOpen = false;

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listOpen) output.push("</ul>");
    listOpen = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      if (!listOpen) {
        output.push("<ul>");
        listOpen = true;
      }
      output.push(`<li>${inlineMarkdown(listItem[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return output.join("\n");
}

export function renderMarkdownExport(document: ExportDocument): string {
  return `---\ntitle: "${document.title.replaceAll('"', '\\"')}"\nslug: "${document.slug}"\nmeta_title: "${document.metaTitle.replaceAll('"', '\\"')}"\nmeta_description: "${document.metaDescription.replaceAll('"', '\\"')}"\nprimary_keyword: "${document.primaryKeyword.replaceAll('"', '\\"')}"\n---\n\n# ${document.title}\n\n${document.excerpt}\n\n${document.bodyMarkdown.trim()}\n`;
}

export function renderHtmlExport(document: ExportDocument): string {
  const title = escapeHtml(document.metaTitle || document.title);
  const description = escapeHtml(document.metaDescription || document.excerpt);
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n<meta name="description" content="${description}">\n<meta name="keywords" content="${escapeHtml(document.primaryKeyword)}">\n</head>\n<body>\n<article>\n<header><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.excerpt)}</p></header>\n${markdownBodyToHtml(document.bodyMarkdown)}\n</article>\n</body>\n</html>\n`;
}
