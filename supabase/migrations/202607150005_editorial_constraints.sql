alter table public.content_briefs
  add constraint content_briefs_topic_id_key unique (topic_id);

alter table public.content_documents
  add constraint content_documents_brief_id_key unique (brief_id);

create index if not exists content_versions_document_created_idx
  on public.content_versions(document_id, version_number desc);
