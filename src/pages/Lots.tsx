import { useMemo, useState } from 'react';
import { IcBoite, IcPlus } from '../composants/Icones';
import { aller, useDonnees } from '../contexte';
import { classeStatut, delaiLisible } from '../lib/affichage';
import { chiffrer, euros, resultatReel } from '../lib/calculs';
import { STATUTS_STOCK, type Lot } from '../types';
import { FicheLot } from './FicheLot';

type Filtre = 'en-cours' | 'stock' | 'vendus' | 'tous';

const FILTRES: { id: Filtre; libelle: string; test: (l: Lot) => boolean }[] = [
  { id: 'en-cours', libelle: 'À étudier et enchères', test: (l) => ['À étudier', 'Inscrit à la vente', 'Enchère placée'].includes(l.statut) },
  { id: 'stock', libelle: 'En stock', test: (l) => STATUTS_STOCK.includes(l.statut) },
  { id: 'vendus', libelle: 'Vendus', test: (l) => l.statut === 'Vendu' },
  { id: 'tous', libelle: 'Tous', test: () => true },
];

export function PageLots({ id }: { id?: string }) {
  const { lots, creerLot, profil, charge } = useDonnees();
  const [filtre, setFiltre] = useState<Filtre>('en-cours');
  const [recherche, setRecherche] = useState('');

  const visibles = useMemo(() => {
    const f = FILTRES.find((x) => x.id === filtre)!;
    const q = recherche.trim().toLowerCase();
    return lots
      .filter(f.test)
      .filter((l) => !q || [l.titre, l.categorie, l.description, l.numeroLot, l.refVente, l.lieuRetrait].join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        // les clôtures les plus proches d'abord, puis les plus récents
        if (a.dateCloture && b.dateCloture) return a.dateCloture.localeCompare(b.dateCloture);
        if (a.dateCloture) return -1;
        if (b.dateCloture) return 1;
        return b.modifieLe.localeCompare(a.modifieLe);
      });
  }, [lots, filtre, recherche]);

  const lot = id ? lots.find((l) => l.id === id) : undefined;
  if (id && lot) return <FicheLot lot={lot} />;
  if (id && charge && !lot) {
    return (
      <div className="panneau vide">
        <h3>Ce lot n’existe plus</h3>
        <p>Il a peut-être été supprimé, ou créé sur un autre appareil. Importez une sauvegarde pour le retrouver.</p>
        <div className="barre-boutons"><a className="bouton" href="#/lots">Retour à mes lots</a></div>
      </div>
    );
  }

  const nouveau = () => aller(`lots/${creerLot().id}`);

  return (
    <div className="pile">
      <div className="titre-page">
        <div>
          <h1>Mes lots</h1>
          <p className="discret">Chaque lot repéré sur les ventes du Domaine, de l’étude à la revente.</p>
        </div>
        <button className="bouton principal" onClick={nouveau}><IcPlus /> Ajouter un lot</button>
      </div>

      {charge && lots.length === 0 ? (
        <div className="panneau vide">
          <h3>Aucun lot pour l’instant</h3>
          <p>Repérez un lot sur le site des enchères du Domaine, puis ajoutez-le ici pour calculer votre enchère maximale.</p>
          <div className="barre-boutons">
            <button className="bouton principal" onClick={nouveau}><IcPlus /> Ajouter un lot</button>
            <a className="bouton" href="#/domaine">Où trouver les ventes</a>
          </div>
        </div>
      ) : (
        <>
          <div className="barre-boutons" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="onglets-filtre" role="group" aria-label="Filtrer les lots">
              {FILTRES.map((f) => (
                <button key={f.id} type="button" aria-pressed={filtre === f.id} onClick={() => setFiltre(f.id)}>
                  {f.libelle}<b>{lots.filter(f.test).length}</b>
                </button>
              ))}
            </div>
            <input aria-label="Rechercher un lot" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ maxWidth: 260 }} />
          </div>

          {visibles.length === 0 && <p className="discret" style={{ padding: '16px 4px' }}>Aucun lot dans cette catégorie.</p>}
          <ul className="liste-lots">
            {visibles.map((l) => {
              const c = chiffrer(l, profil);
              const r = resultatReel(l, profil);
              return (
                <li key={l.id}>
                  <a className="ligne-lot" href={`#/lots/${l.id}`}>
                    {l.photos[0] ? <img className="vignette" src={l.photos[0]} alt="" /> : <div className="vignette"><IcBoite /></div>}
                    <div style={{ minWidth: 0 }}>
                      <h3>{l.titre || 'Lot sans nom'}</h3>
                      <div className="meta">
                        <span className={`statut ${classeStatut(l.statut)}`}>{l.statut}</span>
                        <span>{l.categorie}</span>
                        {l.numeroLot && <span>Lot {l.numeroLot}</span>}
                        {l.dateCloture && !l.achat && <span>Clôture {delaiLisible(l.dateCloture)}</span>}
                        {l.lieuRetrait && <span>{l.lieuRetrait}</span>}
                      </div>
                    </div>
                    <div className="droite">
                      {r ? (
                        <><span>Résultat</span><b className={`nombre ${r.marge >= 0 ? 'positif' : 'negatif'}`}>{euros(r.marge)}</b></>
                      ) : l.achat ? (
                        <><span>Payé</span><b className="nombre">{euros(l.achat.prixAdjuge + l.achat.fraisAcheteur)}</b></>
                      ) : c.prixRevente ? (
                        <><span>Enchère max</span><b className="nombre">{euros(c.enchereMax)}</b></>
                      ) : (
                        <span>À chiffrer</span>
                      )}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
