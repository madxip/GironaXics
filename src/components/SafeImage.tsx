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
  if (!src || (typeof src === 'string' && (src.trim() === '' || src === 'undefined' || src === 'null'))) {
    return null;
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
        return <img src={src} alt={alt} style={imgStyle} {...imgProps} />;
      }
    } catch {
      // Relative path or local asset
    }
  }

  return <Image src={src} alt={alt} {...props} />;
}
