'use client';

import { Node, mergeAttributes, CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

// Extend Commands interface for this custom command
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: { src: string; alt?: string; caption?: string; width?: number }) => ReturnType;
    };
  }
}

// React component for rendering the image with caption
const ImageComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { src, alt, caption, width: savedWidth } = node.attrs as { src: string; alt: string; caption: string; width?: number };
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(caption || '');
  const [imageWidth, setImageWidth] = useState(savedWidth || 600);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [showControls, setShowControls] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  // Calculate aspect ratio when image loads
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      const ratio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
      setAspectRatio(ratio);
      if (!imageHeight) {
        setImageHeight(imageWidth / ratio);
      }
    }
  }, [imageWidth, imageHeight]);

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

  const handleDelete = () => {
    if (confirm('এই ছবিটি মুছে ফেলতে চান?')) {
      deleteNode();
    }
  };

  const handleFitToOriginal = () => {
    if (imageRef.current) {
      const img = new Image();
      img.onload = () => {
        const newWidth = Math.min(img.naturalWidth, 800); // Max 800px
        setImageWidth(newWidth);
        setImageHeight(newWidth / aspectRatio);
        updateAttributes({ width: newWidth });
      };
      img.src = src;
    }
  };

  const handleFitToWidth = () => {
    const newWidth = 700; // Standard content width
    setImageWidth(newWidth);
    setImageHeight(newWidth / aspectRatio);
    updateAttributes({ width: newWidth });
  };

  const startResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startWidthRef.current = imageWidth;
    startHeightRef.current = imageHeight || imageWidth / aspectRatio;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;
      
      let newWidth = startWidthRef.current;
      let newHeight = startHeightRef.current;

      // Handle different resize directions
      switch (resizeHandle) {
        case 'nw': // Top-left corner
        case 'ne': // Top-right corner
        case 'sw': // Bottom-left corner
        case 'se': // Bottom-right corner
          // Corner handles - resize proportionally
          const delta = resizeHandle.includes('e') ? deltaX : -deltaX;
          newWidth = Math.max(200, Math.min(1000, startWidthRef.current + delta * 2));
          newHeight = newWidth / aspectRatio;
          break;
          
        case 'n': // Top edge
        case 's': // Bottom edge
          // Vertical edges - resize height, adjust width to maintain aspect ratio
          const heightDelta = resizeHandle === 's' ? deltaY : -deltaY;
          newHeight = Math.max(100, startHeightRef.current + heightDelta * 2);
          newWidth = newHeight * aspectRatio;
          break;
          
        case 'e': // Right edge
        case 'w': // Left edge
          // Horizontal edges - resize width, adjust height to maintain aspect ratio
          const widthDelta = resizeHandle === 'e' ? deltaX : -deltaX;
          newWidth = Math.max(200, Math.min(1000, startWidthRef.current + widthDelta * 2));
          newHeight = newWidth / aspectRatio;
          break;
      }

      setImageWidth(newWidth);
      setImageHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle('');
      updateAttributes({ width: imageWidth });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, imageWidth, aspectRatio, resizeHandle, updateAttributes]);

  return (
    <NodeViewWrapper className="my-6 flex justify-center">
      <figure 
        className={`relative group ${selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
        style={{ width: `${imageWidth}px`, maxWidth: '100%' }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isResizing && setShowControls(false)}
      >
        {/* Control Buttons - Show on hover or when selected */}
        {(showControls || selected) && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={handleFitToOriginal}
              className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-md transition-all"
              title="মূল আকারে ফিরিয়ে আনুন"
              type="button"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleFitToWidth}
              className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-md transition-all"
              title="প্রস্থে ফিট করুন"
              type="button"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded shadow-md transition-all"
              title="ছবি মুছে ফেলুন"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Image Container */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={alt || caption || 'Image'}
            className="rounded-lg shadow-lg w-full h-auto"
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            draggable={false}
            onLoad={() => {
              if (imageRef.current) {
                const ratio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
                setAspectRatio(ratio);
                if (!imageHeight) {
                  setImageHeight(imageWidth / ratio);
                }
              }
            }}
          />

          {/* Google Docs Style Resize Handles - 8 handles (4 corners + 4 edges) */}
          {(showControls || selected) && (
            <>
              {/* Corner Handles */}
              <div
                className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'nw')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'ne')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'sw')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'se')}
                title="টেনে আকার পরিবর্তন করুন"
              />

              {/* Edge Handles */}
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-ns-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'n')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-ns-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 's')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-ew-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'w')}
                title="টেনে আকার পরিবর্তন করুন"
              />
              <div
                className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-blue-600 border-2 border-white rounded-full cursor-ew-resize hover:scale-150 transition-transform"
                onMouseDown={(e) => startResize(e, 'e')}
                title="টেনে আকার পরিবর্তন করুন"
              />
            </>
          )}

          {/* Resizing Indicator */}
          {isResizing && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded text-sm">
              {Math.round(imageWidth)} × {Math.round(imageHeight || imageWidth / aspectRatio)}px
            </div>
          )}
        </div>

        {/* Caption */}
        <figcaption className="mt-1 text-center">
          {isEditingCaption ? (
            <input
              type="text"
              value={captionValue}
              onChange={handleCaptionChange}
              onBlur={handleCaptionBlur}
              onKeyDown={handleCaptionKeyDown}
              placeholder="ক্যাপশন যোগ করুন..."
              className="w-full text-gray-400 text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2 py-0.5 italic"
              style={{ fontSize: '11px', fontFamily: 'sans-serif', lineHeight: '1.4' }}
              autoFocus
            />
          ) : (
            <span
              onClick={startEditing}
              className="text-gray-400 italic cursor-pointer hover:text-gray-600 transition-colors block"
              style={{ fontSize: '11px', fontFamily: 'sans-serif', lineHeight: '1.4' }}
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
      width: {
        default: 600,
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
          const widthAttr = element.getAttribute('data-width');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            caption: figcaption?.textContent || '',
            width: widthAttr ? parseInt(widthAttr) : 600,
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
            width: 600,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, width } = HTMLAttributes;

    return [
      'figure',
      mergeAttributes({
        'data-image-caption': 'true',
        'data-width': width || 600,
        class: 'my-10 flex flex-col items-center',
        style: `max-width: ${width || 600}px; margin-left: auto; margin-right: auto;`,
      }),
      [
        'img',
        {
          src,
          alt: alt || caption || 'Image',
          class: 'rounded-lg shadow-lg',
          style: `width: 100%; height: auto; max-width: ${width || 600}px;`,
        },
      ],
      [
        'figcaption',
        {
          style: 'text-align: center; font-style: italic; color: #9ca3af; margin-top: 0.5rem; font-size: 12px;',
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
        (options: { src: string; alt?: string; caption?: string; width?: number }) =>
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
