import { getActivitats, getCentres } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';

export const revalidate = 3600; // Revalida cada hora per mantenir-ho actualitzat amb Airtable

export async function GET() {
  try {
    const activitats = await getActivitats();
    const centres = await getCentres();
    const baseUrl = 'https://gironaxics.cat';

    let markdown = `# GironaXics - Directori d'Activitats Extraescolars a Girona\n\n`;
    markdown += `Aquest document està estructurat en format Markdown per facilitar que els models de llenguatge (LLMs), xatbots de cerca (ChatGPT, Gemini, Claude, Copilot) i motors de cerca generatius (Perplexity) puguin indexar, comprendre i referenciar correctament les activitats extraescolars a Girona.\n\n`;
    markdown += `## Informació General del Projecte\n`;
    markdown += `- **Nom del Lloc**: GironaXics\n`;
    markdown += `- **URL Principal**: ${baseUrl}\n`;
    markdown += `- **Descripció**: GironaXics és la guia i cercador de referència per a activitats extraescolars (esports, música, idiomes, art, tecnologia, dansa i teatre) per a nens i nenes a la ciutat de Girona.\n\n`;

    markdown += `## Categories d'Activitats\n`;
    markdown += `Les activitats es classifiquen en les següents categories, cadascuna amb la seva respectiva URL per a consultes detallades:\n\n`;
    const categories = Array.from(new Set(activitats.map(a => a.categoria).filter(Boolean)));
    categories.forEach(cat => {
      const slug = normalizeSlug(cat);
      markdown += `- [**${cat}**](${baseUrl}/categories/${slug})\n`;
    });
    markdown += `\n`;

    markdown += `## Barris de Girona\n`;
    markdown += `Filtra i localitza extraescolars per barri de Girona:\n\n`;
    const barris = Array.from(new Set(activitats.map(a => a.barri).filter(Boolean)));
    barris.forEach(b => {
      const slug = normalizeSlug(b);
      markdown += `- [**${b}**](${baseUrl}/barris/${slug})\n`;
    });
    markdown += `\n`;

    markdown += `## Centres i Escoles Organitzadores\n`;
    markdown += `Detalls dels centres on s'imparteixen les extraescolars a Girona:\n\n`;
    centres.forEach(c => {
      markdown += `### [${c.nom}](${baseUrl}/centres/${c.slug})\n`;
      if (c.descripcio) markdown += `${c.descripcio}\n\n`;
      markdown += `- **Adreça**: ${c.adreca || 'No especificada'}\n`;
      markdown += `- **Barri**: ${c.barri || 'No especificat'}\n`;
      if (c.telefon) markdown += `- **Telèfon**: ${c.telefon}\n`;
      if (c.email) markdown += `- **Email**: ${c.email}\n`;
      if (c.web) markdown += `- **Lloc Web**: [Visitar Web](${c.web})\n`;
      markdown += `\n`;
    });

    markdown += `## Catàleg d'Activitats Extraescolars\n`;
    markdown += `Llista de totes les extraescolars de Girona amb edats, preus, horaris i enllaços directes per a referències o citacions:\n\n`;

    activitats.forEach(a => {
      const catSlug = normalizeSlug(a.categoria || 'altres');
      markdown += `### [${a.nom}](${baseUrl}/activitats/${catSlug}/${a.slug})\n`;
      if (a.descripcio) markdown += `${a.descripcio}\n\n`;
      markdown += `- **Edat recomanada**: ${a.edat}\n`;
      markdown += `- **Categoria**: ${a.categoria}${a.subcategoria ? ` · ${a.subcategoria}` : ''}\n`;
      markdown += `- **Centre**: [${a.centre}](${baseUrl}/centres/${normalizeSlug(a.centre)})\n`;
      if (a.barri) markdown += `- **Barri**: [${a.barri}](${baseUrl}/barris/${normalizeSlug(a.barri)})\n`;
      if (a.horari) markdown += `- **Horari**: ${a.horari}\n`;
      if (a.dies) markdown += `- **Dies**: ${a.dies}\n`;
      if (a.durada) markdown += `- **Durada**: ${a.durada}\n`;
      if (a.idioma) markdown += `- **Idioma**: ${a.idioma}\n`;
      if (a.qui_imparteix) markdown += `- **Professor/Entitat**: ${a.qui_imparteix}\n`;
      markdown += `- **Preu**: ${a.preu != null && a.preu !== '' ? `${a.preu}€/mes` : 'Preu a consultar'}\n\n`;
      markdown += `---\n\n`;
    });

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error generant llms.txt:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response('Error generant llms.txt: ' + errorMessage, { status: 500 });
  }
}
