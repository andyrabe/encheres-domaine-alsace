import { IcPlus } from '../composants/Icones';
import { aller, useDonnees } from '../contexte';
import { classeStatut, dateHeure, delaiLisible, joursAvant } from '../lib/affichage';
import { alertesSeuils, bilanAnnee, chiffrer, euros } from '../lib/calculs';
import { ETAPES_DEMARRAGE } from '../lib/guide';

export function PageAccueil() {
  const { lots, profil, creerLot, etapesDemarrage } = useDonnees();
  const annee = new Date().getFullYear();
  const b = bilanAnnee(lots, profil, annee);
  const alertes = alertesSeuils(b.chiffreAffaires);

  const prochaines = lots
    .filter((l) => !l.achat && l.dateCloture && ['À étudier', 'Inscrit à la vente', 'Enchère placée'].includes(l.statut) && joursAvant(l.dateCloture) >= 0)
    .sort((a, c) => a.dateCloture!.localeCompare(c.dateCloture!))
    .slice(0, 5);
  const aRetirer = lots.filter((l) => l.statut === 'Gagné');
  const enVente = lots.filter((l) => l.statut === 'En vente' || l.statut === 'Retiré');
  const etapesRestantes = ETAPES_DEMARRAGE.filter((e) => !etapesDemarrage.includes(e.id));

  return (
    <div className="pile">
      <div className="titre-page">
        <div>
          <h1>Bonjour{profil.nom ? ` ${profil.nom.split(' ')[0]}` : ''}</h1>
          <p className="discret">
            {lots.length === 0
              ? 'Ajoutez un premier lot repéré sur les ventes du Domaine pour savoir jusqu’où enchérir.'
              : `${b.vendus} vente${b.vendus > 1 ? 's' : ''} en ${annee}, ${b.stockNombre} lot${b.stockNombre > 1 ? 's' : ''} en stock.`}
          </p>
        </div>
        <button className="bouton principal" onClick={() => aller(`lots/${creerLot().id}`)}><IcPlus /> Ajouter un lot</button>
      </div>

      <div className="cles">
        <div className="cle"><span>Chiffre d’affaires {annee}</span><b className="nombre">{euros(b.chiffreAffaires)}</b><small>Somme encaissée sur les reventes</small></div>
        <div className="cle"><span>Gain net {annee}</span><b className={`nombre ${b.margeNette >= 0 ? 'positif' : 'negatif'}`}>{euros(b.margeNette)}</b><small>Ventes moins achats, frais et URSSAF de l’année</small></div>
        <div className="cle"><span>Stock à revendre</span><b className="nombre">{euros(b.stockValeur)}</b><small>{b.stockNombre} lot{b.stockNombre > 1 ? 's' : ''} payé{b.stockNombre > 1 ? 's' : ''}, pas encore vendu{b.stockNombre > 1 ? 's' : ''}</small></div>
        <div className="cle"><span>URSSAF estimée {annee}</span><b className="nombre">{euros(b.prelevements)}</b><small>À déclarer sur le chiffre d’affaires</small></div>
      </div>

      {alertes.map((a) => <div key={a.message} className={`alerte ${a.niveau}`}>{a.message}</div>)}

      <div className="grille-2">
        <section className="panneau">
          <div className="panneau-entete">
            <h2>Ventes qui se terminent</h2>
            <a href="#/lots">Tous les lots</a>
          </div>
          {prochaines.length === 0 ? (
            <p className="discret">Aucune clôture à venir. Renseignez la date de clôture des lots que vous étudiez pour les voir ici.</p>
          ) : (
            <ul className="liste-lots">
              {prochaines.map((l) => {
                const c = chiffrer(l, profil);
                return (
                  <li key={l.id}>
                    <a className="ligne-lot" href={`#/lots/${l.id}`} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3>{l.titre || 'Lot sans nom'}</h3>
                        <div className="meta"><span className={`statut ${classeStatut(l.statut)}`}>{l.statut}</span><span>{dateHeure(l.dateCloture!)}, {delaiLisible(l.dateCloture!)}</span></div>
                      </div>
                      <div className="droite">
                        {c.prixRevente ? <span className="mini-etiquette">max {euros(c.enchereMax)}</span> : <span>À chiffrer</span>}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panneau">
          <h2>À faire</h2>
          <ul className="verifs" style={{ marginBottom: 8 }}>
            {aRetirer.map((l) => <li key={l.id}>Retirer <a href={`#/lots/${l.id}`}>{l.titre || 'le lot'}</a>{l.lieuRetrait ? ` à ${l.lieuRetrait}` : ''}, puis passez-le à l’étape « Retiré ».</li>)}
            {enVente.filter((l) => l.statut === 'Retiré').map((l) => <li key={l.id}>Mettre en vente <a href={`#/lots/${l.id}`}>{l.titre || 'le lot'}</a>.</li>)}
            {etapesRestantes.slice(0, 3).map((e) => <li key={e.id}>{e.titre} (<a href="#/reglages">démarches</a>)</li>)}
          </ul>
          {aRetirer.length === 0 && enVente.length === 0 && etapesRestantes.length === 0 && <p className="discret">Rien d’urgent.</p>}
          <p className="petit discret" style={{ marginTop: 14 }}>
            Déclarez votre chiffre d’affaires à l’URSSAF chaque mois ou chaque trimestre, selon votre choix : le montant est dans l’onglet Comptes.
          </p>
        </section>
      </div>
    </div>
  );
}
