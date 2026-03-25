import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { richTextDocumentExtensions } from '../lib/tiptap/richTextExtensions';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Link2Off,
  ImagePlus,
  ImageIcon,
  Quote,
  Code2,
  Minus,
  Undo2,
  Redo2,
  Loader2,
} from 'lucide-react';
import { AdminService } from '../lib/admin/adminService';

/** Parst gespeicherten Inhalt: TipTap-JSON oder Legacy-Plaintext. */
export function parseTiptapContent(raw: string | null | undefined): JSONContent {
  if (!raw?.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
  try {
    const parsed = JSON.parse(raw) as JSONContent;
    if (parsed && parsed.type === 'doc') {
      return parsed;
    }
  } catch {
    /* Legacy Plaintext */
  }
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: raw ? [{ type: 'text', text: raw }] : [],
      },
    ],
  };
}

function contentJsonEquals(a: JSONContent, b: JSONContent): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** True wenn kein sichtbarer Text und keine eingebetteten Bilder vorhanden sind. */
export function isRichTextEffectivelyEmpty(jsonString: string | null | undefined): boolean {
  if (!jsonString?.trim()) return true;
  try {
    const doc = JSON.parse(jsonString) as JSONContent;
    if (!doc?.content?.length) return true;
    const hasMeaningfulContent = (nodes: JSONContent[]): boolean => {
      for (const node of nodes) {
        if (node.type === 'text' && typeof node.text === 'string' && node.text.trim().length > 0) {
          return true;
        }
        if (node.type === 'image') return true;
        if (Array.isArray(node.content) && hasMeaningfulContent(node.content)) return true;
      }
      return false;
    };
    return !hasMeaningfulContent(doc.content);
  } catch {
    return !jsonString.trim();
  }
}

export interface RichTextEditorProps {
  value: string;
  onChange: (json: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeightClassName?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`rounded p-1.5 transition-colors ${
      active
        ? 'bg-blue-100 text-blue-800'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    } disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const ToolbarDivider: React.FC = () => <span className="mx-1 h-6 w-px self-center bg-gray-200" />;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Inhalt des Artikels…',
  disabled = false,
  className = '',
  minHeightClassName = 'min-h-[280px]',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      ...richTextDocumentExtensions,
      Placeholder.configure({
        placeholder,
      }),
    ],
    editable: !disabled,
    content: parseTiptapContent(value),
    editorProps: {
      attributes: {
        class: `prose-editor focus:outline-none px-3 py-2 text-sm text-gray-900 ${minHeightClassName}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  // Externes value (z. B. anderer Datensatz) in den Editor spiegeln
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = parseTiptapContent(value);
    const current = editor.getJSON();
    if (!contentJsonEquals(current, next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link-URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImageByUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Bild-URL', 'https://');
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }, [editor]);

  const onImageFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editor) return;
      setImageError(null);
      setUploadingImage(true);
      try {
        const url = await AdminService.uploadContentImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
        setImageError(msg);
      } finally {
        setUploadingImage(false);
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div
        className={`rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center ${minHeightClassName} ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          title="Fett"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Kursiv"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Unterstrichen"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          disabled={disabled}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Durchgestrichen"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={disabled}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Überschrift 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          disabled={disabled}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Überschrift 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Überschrift 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Aufzählung"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Nummerierte Liste"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Linksbündig"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          disabled={disabled}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Zentriert"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          disabled={disabled}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Rechtsbündig"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          disabled={disabled}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Link setzen" onClick={setLink} disabled={disabled}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Link entfernen"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled || !editor.isActive('link')}
        >
          <Link2Off className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Bild hochladen"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingImage}
        >
          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </ToolbarButton>
        <ToolbarButton title="Bild per URL" onClick={addImageByUrl} disabled={disabled}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageFileSelected}
        />

        <ToolbarDivider />

        <ToolbarButton
          title="Zitat"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Code-Block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          disabled={disabled}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Trennlinie"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Rückgängig" onClick={() => editor.chain().focus().undo().run()} disabled={disabled}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Wiederholen" onClick={() => editor.chain().focus().redo().run()} disabled={disabled}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      {imageError && <p className="px-3 py-1.5 text-xs text-error-600 bg-error-50 border-t border-error-100">{imageError}</p>}
    </div>
  );
};

export default RichTextEditor;
