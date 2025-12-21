'use client';

import { Node, mergeAttributes, CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';

// Extend Commands interface for this custom command
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

// React component for rendering the image with caption
const ImageComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, selected } = props;
  const { src, alt, caption } = node.attrs as { src: string; alt: string; caption: string };
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(caption || '');

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptionValue(e.target.value);
  };

  const handleCaptionBlur = () => {
    setIsEditingCaption(false);
    updateAttributes({ caption: captionValue });
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditingCaption(false);
      updateAttributes({ caption: captionValue });
    }
    if (e.key === 'Escape') {
      setIsEditingCaption(false);
      setCaptionValue(caption || '');
    }
  };

  const startEditing = () => {
    setCaptionValue(caption || '');
    setIsEditingCaption(true);
  };

  return (
    <NodeViewWrapper className="my-6 flex justify-center">
      <figure 
        className={`relative ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
        style={{ width: '500px' }}
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/next/no-img-element */}
        <img
          src={src}
          alt={alt || caption || 'Image'}
          className="rounded-lg shadow-lg"
          style={{ width: '500px', height: '500px', objectFit: 'cover' }}
          draggable={false}
        />

        {/* Caption */}
        <figcaption className="mt-2 text-center" style={{ fontSize: '11px' }}>
          {isEditingCaption ? (
            <input
              type="text"
              value={captionValue}
              onChange={handleCaptionChange}
              onBlur={handleCaptionBlur}
              onKeyDown={handleCaptionKeyDown}
              placeholder="ক্যাপশন যোগ করুন..."
              className="w-full text-gray-500 text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-1"
              style={{ fontSize: '11px' }}
              autoFocus
            />
          ) : (
            <span
              onClick={startEditing}
              className="text-gray-500 italic cursor-pointer hover:text-gray-700:text-gray-400 transition-colors block"
              style={{ fontSize: '16px' }}
            >
              {caption || 'ক্যাপশন যোগ করতে ক্লিক করুন...'}
            </span>
          )}
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
};

// Custom Tiptap extension for image with caption
export const ImageWithCaption = Node.create({
  name: 'imageWithCaption',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-image-caption]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            caption: figcaption?.textContent || '',
          };
        },
      },
      // Also parse regular images and convert them
      {
        tag: 'img[src]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            caption: '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption } = HTMLAttributes;

    return [
      'figure',
      mergeAttributes({
        'data-image-caption': 'true',
        class: 'my-10 flex flex-col items-center',
      }),
      [
        'img',
        {
          src,
          alt: alt || caption || 'Image',
          class: 'rounded-lg shadow-lg',
          style: 'width: 500px; height: 500px; object-fit: cover;',
        },
      ],
      [
        'figcaption',
        {
          style: 'text-align: center; font-style: italic; color: #9ca3af; margin-top: 0.5rem; font-size: 11px;',
        },
        caption || '',
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      setImageWithCaption:
        (options: { src: string; alt?: string; caption?: string }) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ImageWithCaption;

