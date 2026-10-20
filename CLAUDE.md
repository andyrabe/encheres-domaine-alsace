# Notes pour Claude Code

Outil personnel (en français) d'achat-revente des lots vendus par le Domaine (enchères de l'État).
Tout le texte visible, les noms de variables et les commentaires sont en français : garder cette convention.

## Commandes
- `npm run dev`, `npm test` (Vitest, `tests/`), `npm run build` (tsc puis Vite).

## Architecture
- Appli statique Vite + React 18 + TypeScript, navigation par ancre (`#/lots/<id>`) dans `src/contexte.tsx`.
- Données dans IndexedDB (`idb-keyval`) via `usePersistant` (`src/lib/store.ts`). Pas de serveur ; export/import JSON.
- `src/lib/calculs.ts` : enchère maximale, estimation par comparables, bilan annuel, seuils. Fonctions pures et testées.
- `src/lib/registres.ts` : livre des recettes, registre des achats, registre des objets mobiliers, export CSV (séparateur `;`, BOM).
- `src/lib/guide.ts` : démarches, sources, vérifications.

## Règles
- Ne pas automatiser la lecture d'encheres-domaine.gouv.fr : le site impose une protection anti-robots, il ne faut pas la contourner.
- Frais acheteur du Domaine : 11 % (enchères), 6 % (appel d'offres). Seuils 2026 : franchise TVA 85 000 € / 93 500 €, plafond micro 203 100 €. Cotisations vente de marchandises 12,3 % + CFP 0,1 %. À mettre à jour chaque année avec les tests.
- Design : gris acier, vert billet pour les gains, étiquette de lot jaune pour les chiffres clés (`.etiquette-lot`), police Archivo. Mode sombre pris en charge.
