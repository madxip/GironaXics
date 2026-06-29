'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

const ALLOWED_DOMAINS = [
  'v5.airtableusercontent.com',
  'dl.airtable.com',
  'images.unsplash.com',
  'files.catbox.moe',
  'tmpfiles.org'
];

export default function SafeImage({ src, alt, ...props }: ImageProps) {
  const [error, setError] = React.useState(false);

  if (!src || (typeof src === 'string' && (src.trim() === '' || src === 'undefined' || src === 'null'))) {
    return null;
  }

  if (error) {
    const fallbackStyle: React.CSSProperties = props.fill ? {
      position: 'absolute',
      height: '100%',
      width: '100%',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--crema-fosca)',
      borderRadius: 'inherit'
    } : {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--crema-fosca)',
      width: '100%',
      aspectRatio: '1',
      borderRadius: '8px',
      padding: '24px'
    };

    return (
      <div style={fallbackStyle} className="image-error-fallback">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--verd)" strokeWidth="1.5" style={{ opacity: 0.3, width: props.fill ? '35%' : '28px', height: props.fill ? '35%' : '28px' }} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  if (typeof src === 'string') {
    try {
      const url = new URL(src);
      const isAllowed = ALLOWED_DOMAINS.some(domain => 
        url.hostname === domain || url.hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fill, style, priority, quality, placeholder, blurDataURL, ...rest } = props;
        
        const imgStyle: React.CSSProperties = fill ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          objectFit: (style?.objectFit as React.CSSProperties['objectFit']) || 'cover',
          ...style
        } : { ...style };

        const imgProps = rest as React.ImgHTMLAttributes<HTMLImageElement>;

        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} style={imgStyle} onError={() => setError(true)} {...imgProps} />;
      }
    } catch {
      // Relative path or local asset
    }
  }

  const isExternal = typeof src === 'string' && (
    src.startsWith('/api/imatges') ||
    ALLOWED_DOMAINS.some(domain => {
      try { return new URL(src).hostname.endsWith(domain) || new URL(src).hostname === domain; }
      catch { return false; }
    })
  );

  return <Image src={src} alt={alt} onError={() => setError(true)} unoptimized={isExternal} {...props} />;
}
