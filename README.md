# Carnet de revente

Outil personnel pour faire de l'achat-revente à partir des ventes aux enchères du Domaine (l'État) : véhicules de fourrière, outillage, informatique, objets saisis.

## Ce que fait l'appli

- **Mes lots** : une fiche par lot repéré. Vous relevez quelques annonces comparables (Leboncoin…), l'appli estime le prix de revente avec une décote de prudence et calcule **l'enchère maximale** : le prix à ne pas dépasser pour garder votre marge, en comptant les frais acheteur du Domaine (11 % aux enchères, 6 % en appel d'offres), le transport, les réparations, les frais de la plateforme et l'URSSAF.
- **Suivi** : à étudier, inscrit, enchère placée, gagné, retiré, en vente, vendu. Le résultat réel de chaque lot est calculé à la vente.
- **Ventes** : où trouver les ventes du Domaine, comment participer, vérifications avant d'enchérir (et vérifications propres aux véhicules).
- **Comptes** : chiffre d'affaires à déclarer par trimestre, URSSAF estimée, seuils 2026 (franchise de TVA 85 000 €, plafond micro 203 100 €), et préparation des registres : livre des recettes, registre des achats, registre des objets mobiliers. Export Excel (CSV) et impression.
- **Réglages** : démarches pour démarrer (micro-entreprise, déclaration de revendeur d'objets d'occasion en préfecture…), taux de cotisations, sauvegarde.

Le site des enchères du Domaine bloque la lecture automatique : l'appli ne récupère pas les lots toute seule, vous les ajoutez à la main avec leur lien.

Vos données restent **dans votre navigateur** (rien n'est envoyé sur un serveur). Pour passer du PC au téléphone : Réglages, Exporter puis Importer.

## Mise en ligne

Le workflow « Tests et publication » publie l'appli sur GitHub Pages à chaque envoi si le dépôt est public :

1. Settings → Pages → **Source : GitHub Actions**.
2. Actions → « Tests et publication » → **Run workflow**.
3. L'appli est à l'adresse `https://<votre-nom>.github.io/<nom-du-depot>/`.

Dépôt privé : publiez plutôt avec Vercel (« Add New… → Project », importez le dépôt).

## Développement

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # tests des calculs et des registres
npm run build
```

## Avertissement

Les montants sont des estimations. Les règles des micro-entreprises changent : vérifiez vos taux sur autoentrepreneur.urssaf.fr. Le registre des objets mobiliers officiel doit être tenu sur papier (sans rature) ou dans un logiciel inaltérable : l'appli prépare les lignes à y recopier.
