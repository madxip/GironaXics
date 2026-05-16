# Estructura d'Airtable - GironaXics

Aquest document defineix exactament quines taules i camps has de crear a Airtable per connectar-ho amb el projecte Next.js.

## Taula `Activitats`
Conté el catàleg de totes les activitats extraescolars.

- **slug**: `Single line text` (Camp principal/Primary Field). Format: `identificador-unic`. Exemple: `taller-ceramica-infantil`
- **nom**: `Single line text`. Nom de l'activitat. Exemple: `Taller de Ceràmica Infantil`
- **centre**: `Link to another record`. (Referencia a la taula `Centres`). Exemple: `L'Argila de la Lali`
- **barri**: `Single select`. Opcions:
  - Barri Vell
  - Eixample
  - Sant Narcís
  - Germans Sàbat
  - Santa Eugènia
  - Montilivi
  - Palau
  - Vila-roja
  - Mas Xirgu
  - Centre
- **categoria**: `Single select`. Opcions:
  - Esports
  - Música
  - Idiomes
  - Dansa
  - Robòtica
  - Teatre
  - Arts plàstiques
  - Cuina
  - Ioga
  - Escacs
  - Programació
  - Naturalesa
- **edat**: `Single line text`. Exemple: `5-10 anys`
- **preu**: `Number`. Preu en euros/mes (sense símbols). Exemple: `35`
- **destacada**: `Checkbox`. Si està marcat, apareixerà a la secció "El nostre recull" a l'inici.
- **horari**: `Single line text`. Exemple: `17:00 - 18:30`
- **dies**: `Single line text`. Exemple: `Dimarts i Dijous`
- **descripcio**: `Long text` (amb "Enable rich text formatting" opcional, tot i que s'interpreta text normal en React sense perill). Mínim 150 paraules per SEO.
- **durada**: `Single line text`. Exemple: `1,5h/sessió`
- **alumnes**: `Single line text`. Exemple: `Màx. 8 nens`
- **material**: `Single line text`. Exemple: `Inclòs`
- **inici**: `Single line text`. Exemple: `Octubre`
- **idioma**: `Single line text`. Exemple: `Català`
- **publicada**: `Checkbox`. Només es mostren les activitats amb aquesta casella marcada.

---

## Taula `Centres`
Conté el directori de proveïdors (acadèmies, clubs, tallers).

- **nom**: `Single line text` (Camp principal/Primary Field). Exemple: `L'Argila de la Lali`
- **slug**: `Single line text`. Exemple: `largila-de-la-lali`
- **adreça**: `Single line text`. Exemple: `Carrer de les Ferreries Velles, 14`
- **telefon**: `Single line text`. Exemple: `600 000 000`
- **email**: `Email`. Exemple: `hola@argilalali.cat`
- **web**: `URL`. Exemple: `https://www.argilalali.cat`
- **barri**: `Single select` (mateixes opcions que Activitats).
- **descripcio**: `Long text`. Breu descripció del centre.
