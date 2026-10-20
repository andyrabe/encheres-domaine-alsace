import { useDonnees } from '../contexte';
import { SOURCES, VERIFICATIONS_LOT } from '../lib/guide';

export function PageDomaine() {
  const { visitesSources, noterVisiteSource } = useDonnees();

  return (
    <div className="pile" style={{ maxWidth: 900 }}>
      <div className="titre-page">
        <div>
          <h1>Les ventes du Domaine</h1>
          <p className="discret">
            L’État vend aux enchères des véhicules de fourrière, du matériel, des objets saisis ou abandonnés. Les ventes sont
            ouvertes à tous, en ligne pour la plupart.
          </p>
        </div>
      </div>

      <section className="panneau">
        <h2>Où regarder</h2>
        <p className="petit discret">
          Ces sites ne permettent pas la lecture automatique : ouvrez-les depuis ici, l’appli note votre dernier passage.
          Quand un lot vous intéresse, ajoutez-le dans « Mes lots » avec son lien.
        </p>
        <ul className="etapes-demarrage">
          {SOURCES.map((s) => {
            const vu = visitesSources[s.url];
            return (
              <li key={s.url} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <div>
                  <a href={s.url} target="_blank" rel="noreferrer" onClick={() => noterVisiteSource(s.url)}><strong>{s.nom}</strong></a>
                  <div className="petit discret">{s.description}</div>
                </div>
                <span className="petit discret" style={{ whiteSpace: 'nowrap' }}>
                  {vu ? `Vu le ${new Date(vu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'Jamais consulté'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grille-2">
        <section className="panneau">
          <h2>Comment participer</h2>
          <ol className="petit" style={{ paddingLeft: 20, margin: 0 }}>
            <li>Créez votre compte sur le site des enchères du Domaine et faites valider vos justificatifs.</li>
            <li>Inscrivez-vous à la vente qui vous intéresse en versant la caution demandée.</li>
            <li>Allez à l’exposition des lots quand elle existe : c’est là qu’on évite les mauvaises surprises.</li>
            <li>Enchérissez sans dépasser votre enchère maximale.</li>
            <li>Si vous gagnez, payez dans le délai indiqué et retirez le lot avant la date limite.</li>
          </ol>
          <p className="petit discret" style={{ marginTop: 12 }}>
            Les frais de vente s’ajoutent au prix adjugé : 11 % pour les enchères, 6 % pour les appels d’offres. L’appli en tient compte
            dans l’enchère maximale.
          </p>
        </section>

        <section className="panneau">
          <h2>Avant chaque enchère</h2>
          <ul className="verifs">{VERIFICATIONS_LOT.map((v) => <li key={v}>{v}</li>)}</ul>
        </section>
      </div>

      <section className="panneau">
        <h2>Ce qui se revend le mieux</h2>
        <p className="petit">
          Les objets dont le prix d’occasion est facile à vérifier et qui se transportent dans une voiture : outillage électroportatif
          de marque, petit électroménager, téléphones et ordinateurs récents, matériel de sport. Les véhicules rapportent plus mais
          demandent plus d’argent immobilisé, de démarches et de risques. Commencez par des petits lots pour apprendre les prix.
        </p>
        <p className="petit discret" style={{ marginBottom: 0 }}>
          Lisez les conditions de chaque vente : les lots sont généralement vendus en l’état, et votre marge doit couvrir les lots décevants.
        </p>
      </section>
    </div>
  );
}
