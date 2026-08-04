-- 3. SPONSORS
INSERT INTO public.sponsors (id, nom, categoria_slug, imatge_url, enllac, actiu, descripcio, imatge_fons_url, titol, posicio_fons, ciutat)
VALUES ('rec7qrqhsLCY4iwTx', 'Esports Parra', 'general', '', 'https://esportsparra.com/', TRUE, '', '', '', '', 'girona')
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom, categoria_slug = EXCLUDED.categoria_slug, imatge_url = EXCLUDED.imatge_url, enllac = EXCLUDED.enllac, actiu = EXCLUDED.actiu, descripcio = EXCLUDED.descripcio, imatge_fons_url = EXCLUDED.imatge_fons_url, titol = EXCLUDED.titol, posicio_fons = EXCLUDED.posicio_fons;
INSERT INTO public.sponsors (id, nom, categoria_slug, imatge_url, enllac, actiu, descripcio, imatge_fons_url, titol, posicio_fons, ciutat)
VALUES ('recK8zoJAJShVNoCe', 'Grup Vivaldi', 'general', '', 'https://www.grupvivaldi.com/', TRUE, '', '', '', '', 'girona')
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom, categoria_slug = EXCLUDED.categoria_slug, imatge_url = EXCLUDED.imatge_url, enllac = EXCLUDED.enllac, actiu = EXCLUDED.actiu, descripcio = EXCLUDED.descripcio, imatge_fons_url = EXCLUDED.imatge_fons_url, titol = EXCLUDED.titol, posicio_fons = EXCLUDED.posicio_fons;

