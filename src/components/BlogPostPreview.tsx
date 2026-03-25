import React, { useMemo } from 'react';
import { generateHTML } from '@tiptap/core';
import { Info } from 'lucide-react';
import { parseTiptapContent } from './RichTextEditor';
import { richTextDocumentExtensions } from '../lib/tiptap/richTextExtensions';

export interface BlogPostPreviewProps {
  formData: Partial<{
    type: 'blog' | 'news';
    status: 'draft' | 'published';
    title?: string;
    excerpt?: string | null;
    content?: string;
    cover_image_url?: string | null;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }>;
  selectedCategoryNames: string[];
  selectedTagNames: string[];
}

function formatPreviewDate(formData: BlogPostPreviewProps['formData']): string {
  const iso =
    formData.status === 'published' && formData.published_at
      ? formData.published_at
      : formData.updated_at || formData.created_at;
  if (!iso) {
    return new Date().toLocaleString('de-DE', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }
  return new Date(iso).toLocaleString('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({
  formData,
  selectedCategoryNames,
  selectedTagNames,
}) => {
  const bodyHtml = useMemo(() => {
    try {
      const doc = parseTiptapContent(formData.content);
      return generateHTML(doc, richTextDocumentExtensions);
    } catch {
      return '<p class="text-gray-500">Inhalt konnte nicht gerendert werden.</p>';
    }
  }, [formData.content]);

  const title = formData.title?.trim() || 'Ohne Titel';
  const typeLabel = formData.type === 'news' ? 'News' : 'Blog';
  const isDraft = formData.status !== 'published';

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
        <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" aria-hidden />
        <p>
          Diese Vorschau zeigt das finale Darstellungs-Layout. Das tatsächliche Design der öffentlichen App kann
          abweichen.
        </p>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 flex flex-wrap items-center gap-2">
          {isDraft ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              Entwurf
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800">
              Veröffentlicht
            </span>
          )}
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{typeLabel}</span>
        </div>

        <div className="px-6 pt-8 pb-10 max-w-3xl mx-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              <time dateTime={formData.published_at || formData.updated_at || undefined}>{formatPreviewDate(formData)}</time>
              <span className="mx-2">·</span>
              <span>Redaktion</span>
            </p>
          </header>

          {formData.excerpt?.trim() ? (
            <p className="text-lg text-gray-600 leading-relaxed mb-6 border-l-4 border-primary-300 pl-4">
              {formData.excerpt.trim()}
            </p>
          ) : null}

          {formData.cover_image_url?.trim() ? (
            <figure className="mb-8">
              <img
                src={formData.cover_image_url.trim()}
                alt=""
                className="w-full max-h-[320px] object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </figure>
          ) : null}

          <div
            className="prose-editor text-base text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {(selectedCategoryNames.length > 0 || selectedTagNames.length > 0) && (
            <footer className="mt-10 pt-6 border-t border-gray-100 space-y-3">
              {selectedCategoryNames.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kategorien</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {selectedCategoryNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedTagNames.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tags</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {selectedTagNames.map((name) => (
                      <span key={name} className="text-sm text-primary-700">
                        #{name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </footer>
          )}
        </div>
      </article>
    </div>
  );
};

export default BlogPostPreview;
