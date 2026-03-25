import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

/**
 * Gleiche Extension-Kette wie im RichTextEditor (ohne Placeholder),
 * damit generateHTML und Editor dasselbe Schema nutzen.
 */
export const richTextDocumentExtensions: Extensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg my-4',
    },
  }),
];
