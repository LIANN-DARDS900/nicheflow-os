import { NextResponse, type NextRequest } from "next/server";
import { renderHtmlExport, renderMarkdownExport } from "@/lib/publishing/export";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") === "html" ? "html" : "markdown";
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: document, error } = await supabase
    .from("content_documents")
    .select("title,slug,excerpt,body_markdown,meta_title,meta_description,primary_keyword,status")
    .eq("id", id)
    .single();

  if (error || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!["approved", "scheduled", "published"].includes(document.status)) return NextResponse.json({ error: "Only approved documents can be exported." }, { status: 409 });

  const exportDocument = {
    title: document.title,
    slug: document.slug,
    excerpt: document.excerpt,
    bodyMarkdown: document.body_markdown,
    metaTitle: document.meta_title,
    metaDescription: document.meta_description,
    primaryKeyword: document.primary_keyword,
  };
  const body = format === "html" ? renderHtmlExport(exportDocument) : renderMarkdownExport(exportDocument);
  const extension = format === "html" ? "html" : "md";
  const contentType = format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${document.slug}.${extension}"`,
      "cache-control": "private, no-store",
    },
  });
}
