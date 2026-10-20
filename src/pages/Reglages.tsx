import { useRef, useState } from 'react';
import { ChampNombre, ChampTexte } from '../composants/Champs';
import { useDonnees } from '../contexte';
import { exporterTout, importerTout, telechargerFichier } from '../lib/store';
import { ETAPES_DEMARRAGE } from '../lib/guide';
import type { Profil } from '../types';

export function PageReglages() {
  const { profil, setProfil, lots, etapesDemarrage, basculerEtape, notifier } = useDonnees();
  const fichier = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string>();
  const maj = (p: Partial<Profil>) => setProfil({ ...profil, ...p });

  const exporter = async () => {
    telechargerFichier(`carnet-revente-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exporterTout()));
    notifier('Sauvegarde téléchargée');
  };
  const importer = async (f?: File) => {
    if (!f) return;
    setErreur(undefined);
    try {
      const { lots: n } = await importerTout(JSON.parse(await f.text()));
      notifier(`${n} lot(s) importé(s)`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setErreur(e instanceof SyntaxError ? 'Ce fichier n’est pas lisible : choisissez un fichier .json exporté depuis l’appli.' : (e as Error).message);
    }
  };

  return (
    <div className="pile" style={{ maxWidth: 860 }}>
      <div className="titre-page"><h1>Réglages</h1></div>

      <section className="panneau">
        <h2>Démarrer l’activité</h2>
        <p className="petit discret">Revendre une fois un objet personnel ne demande rien. Acheter pour revendre régulièrement est une activité commerciale : voici les démarches.</p>
        <ol className="etapes-demarrage">
          {ETAPES_DEMARRAGE.map((e) => {
            const fait = etapesDemarrage.includes(e.id);
            return (
              <li key={e.id} className={fait ? 'fait' : undefined}>
                <input type="checkbox" checked={fait} onChange={() => basculerEtape(e.id)} aria-label={`${e.titre} : fait`} style={{ marginTop: 3 }} />
                <div>
                  <strong>{e.titre}</strong>
                  <div className="petit discret">{e.detail}</div>
                  {e.lien && <a className="petit" href={e.lien.url} target="_blank" rel="noreferrer">{e.lien.libelle}</a>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="panneau">
        <fieldset>
          <legend>Votre entreprise</legend>
          <div className="grille-champs" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            <ChampTexte libelle="Nom et prénom" valeur={profil.nom} onChange={(v) => maj({ nom: v })} />
            <ChampTexte libelle="SIRET" valeur={profil.siret} onChange={(v) => maj({ siret: v })} />
            <ChampTexte libelle="Téléphone" type="tel" valeur={profil.telephone} onChange={(v) => maj({ telephone: v })} />
            <ChampTexte libelle="Courriel" type="email" valeur={profil.email} onChange={(v) => maj({ email: v })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <ChampTexte libelle="Adresse" valeur={profil.adresse} onChange={(v) => maj({ adresse: v })} multiligne lignes={2} />
          </div>
        </fieldset>
        <fieldset>
          <legend>Prélèvements URSSAF</legend>
          <div className="grille-champs">
            <ChampNombre libelle="Cotisations sociales" valeur={profil.tauxCotisationsPct} onChange={(v) => maj({ tauxCotisationsPct: v ?? 0 })} unite="%" aide="12,3 % en 2026 pour la vente de marchandises. Plus bas la première année avec l’ACRE." />
            <ChampNombre libelle="Formation professionnelle" valeur={profil.tauxCfpPct} onChange={(v) => maj({ tauxCfpPct: v ?? 0 })} unite="%" aide="0,1 % pour une activité commerciale" />
            <ChampNombre libelle="Versement libératoire" valeur={profil.tauxVersementLiberatoirePct} onChange={(v) => maj({ tauxVersementLiberatoirePct: v ?? 0 })} unite="%" aide="Impôt sur le revenu payé avec les cotisations" />
          </div>
          <label className="case" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={profil.versementLiberatoire} onChange={(e) => maj({ versementLiberatoire: e.target.checked })} />
            J’ai choisi le versement libératoire de l’impôt sur le revenu
          </label>
          <p className="petit discret" style={{ marginTop: 8 }}>Vérifiez votre taux exact sur autoentrepreneur.urssaf.fr : il dépend de votre date de création et de l’ACRE.</p>
        </fieldset>
        <fieldset>
          <legend>Marge par défaut des nouveaux lots</legend>
          <div className="grille-champs">
            <ChampNombre libelle="Marge minimale" valeur={profil.margeMinEurosDefaut} onChange={(v) => maj({ margeMinEurosDefaut: v ?? 0 })} unite="€" aide="Votre temps a un prix : au moins un trajet et une annonce" />
            <ChampNombre libelle="Marge visée" valeur={profil.margeMinPctDefaut} onChange={(v) => maj({ margeMinPctDefaut: v ?? 0 })} unite="%" aide="Du prix de revente" />
          </div>
        </fieldset>
      </section>

      <section className="panneau">
        <h2>Sauvegarde et autres appareils</h2>
        <p>
          Vos lots, photos et comptes sont enregistrés uniquement dans ce navigateur ({lots.length} lot{lots.length > 1 ? 's' : ''}).
          Exportez-les régulièrement : vider les données du navigateur les efface. Pour les retrouver sur votre téléphone, importez le fichier sur l’autre appareil.
        </p>
        <div className="barre-boutons">
          <button className="bouton principal" onClick={exporter}>Exporter mes données</button>
          <button className="bouton" onClick={() => fichier.current?.click()}>Importer une sauvegarde</button>
          <input ref={fichier} type="file" accept="application/json,.json" hidden onChange={(e) => { importer(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {erreur && <div className="alerte bloquant" style={{ marginTop: 12 }}>{erreur}</div>}
      </section>

      <p className="avertissement">
        Les montants sont des estimations. Les règles des micro-entreprises changent régulièrement : vérifiez-les sur les sites de
        l’URSSAF et des impôts, ou auprès d’un comptable.
      </p>
    </div>
  );
}
