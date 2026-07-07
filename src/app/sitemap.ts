import { MetadataRoute } from 'next';
import { getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activitats = await getActivitats();
  const baseUrl = 'https://gironaxics.cat';

  const routes = [
    '',
    '/per-a-centres',
    '/patrocinis',
    '/preguntes-frequents',
    '/contacte',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const categories = new Set<string>();
  const centres = new Set<string>();
  const barris = new Set<string>();

  const activitatRoutes = activitats.map((a) => {
    const cats = a.categories || [a.categoria];
    cats.forEach((c: string) => { if (c) categories.add(normalizeSlug(c)); });
    if (a.centre) centres.add(normalizeSlug(a.centre));
    if (a.barri) barris.add(normalizeSlug(a.barri));

    return {
      url: `${baseUrl}/activitats/${normalizeSlug(a.categoria || 'altres')}/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    };
  });

  const categoryRoutes = Array.from(categories).map((c) => ({
    url: `${baseUrl}/categories/${c}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  const centreRoutes = Array.from(centres).map((c) => ({
    url: `${baseUrl}/centres/${c}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const barriRoutes = Array.from(barris).map((b) => ({
    url: `${baseUrl}/barris/${b}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...activitatRoutes, ...categoryRoutes, ...centreRoutes, ...barriRoutes];
}
