# GironaXics

El directori d'activitats extraescolars a Girona per a nens i nenes, impulsat per Next.js 14 i Airtable.

## Requisits

- Node.js 18.x o superior
- Gestor de paquets npm o yarn
- Compte d'Airtable amb el Base corresponent per obtenir les dades
- L'Airtable ha de tenir les taules `Centres` i `Activitats` configurades correctament

## Instal·lació i Configuració

1. Clona el repositori.
2. Instal·la les dependències:
   ```bash
   npm install
   ```
3. Crea un fitxer `.env.local` a l'arrel del projecte utilitzant `.env.example` com a plantilla i afegeix-hi les teves credencials d'Airtable:
   ```bash
   cp .env.example .env.local
   ```
   Omple les variables al fitxer `.env.local`:
   - `AIRTABLE_API_KEY`: El teu Personal Access Token d'Airtable amb permisos de lectura.
   - `AIRTABLE_BASE_ID`: L'ID de la base d'Airtable (sol començar per `app...`).

## Execució en Local

Per executar el projecte en mode desenvolupament:

```bash
npm run dev
```

Obre http://localhost:3000 al teu navegador.

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desenvolupament (hot-reloading, SSR segons convingui).
- `npm run build`: Construeix l'aplicació per a producció (crea les pàgines estàtiques i optimitza els actius).
- `npm run start`: Executa la versió de producció creada amb `build`.
- `npm run lint`: Executa l'eina de linter per detectar errors de codi.

## Estructura i Tecnologies

- **Framework**: Next.js (App Router)
- **CMS**: Airtable per a gestionar els centres, activitats i les dades relacionades
- **Estils**: Vanilla CSS (`src/app/globals.css`)
- **Imatges**: Suport natiu amb `next/image` per compressió automàtica i WebP

## Integració amb Airtable

L'aplicació obté les dades dinàmiques des de l'API d'Airtable (`src/lib/airtable.ts`).
Utilitza offset automàtic per a obtenir més de 100 registres (que és el límit per defecte d'Airtable), garantint que apareguin totes les activitats de la base de dades sense cap pèrdua. A més, inclou mecanismes de sanitització en els `slugs` i normalització de camps (per exemple convertint "Centro" a "Centre").

## Contribució i Desplegament

El desplegament recomanat és mitjançant [Vercel](https://vercel.com/), que aprofita les funcionalitats Edge de Next.js. Només has de vincular aquest repositori de Git al teu compte de Vercel i assegurar-te de configurar les variables d'entorn (`AIRTABLE_API_KEY` i `AIRTABLE_BASE_ID`) a la pestanya Settings del teu projecte.
