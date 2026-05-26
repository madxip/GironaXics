import React from 'react';

/**
 * Component that safely injects JSON‑LD structured data.
 * It stringifies the object and escapes the closing </script> tag to avoid XSS.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/<\//g, '<\\/'); // escape </script>
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
