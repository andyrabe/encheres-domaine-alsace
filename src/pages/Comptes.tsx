import { useMemo, useState, type ReactNode } from 'react';
import { IcExport, IcImprimer } from '../composants/Icones';
import { useDonnees } from '../contexte';
import { telechargerFichier } from '../lib/store';
import { alertesSeuils, bilanAnnee, euros, pct, SEUILS, tauxPrelevementsPct } from '../lib/calculs';
import {
  COLONNES_ACHATS, COLONNES_OBJETS, COLONNES_RECETTES, lignesAchats, lignesObjets, lignesRecettes, versCsv, type Colonne,
} from '../lib/registres';

type Registre = 'recettes' | 'achats' | 'objets';

function Tableau<T>({ colonnes, lignes, cle }: { colonnes: Colonne<T>[]; lignes: T[]; cle: (l: T) => string }) {
  const total = colonnes.find((c) => c.montant);
  return (
    <div className="defilement">
      <table className="tableau">
        <thead><tr>{colonnes.map((c) => <th key={c.titre} className={c.montant ? 'montant' : undefined}>{c.titre}</th>)}</tr></thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={cle(l)}>
              {colonnes.map((c) => {
                const v = c.valeur(l);
                return <td key={c.titre} className={c.montant ? 'montant' : undefined}>{c.montant && typeof v === 'number' ? euros(v, 2) : v}</td>;
              })}
            </tr>
          ))}
        </tbody>
        {total && lignes.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={colonnes.indexOf(total)}>Total</td>
              <td className="montant">{euros(lignes.reduce((s, l) => s + Number(total.valeur(l)), 0), 2)}</td>
              {colonnes.slice(colonnes.indexOf(total) + 1).map((c) => <td key={c.titre} />)}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function Jauge({ libelle, valeur, seuil, aide }: { libelle: string; valeur: number; seuil: number; aide: ReactNode }) {
  const ratio = Math.min(1, valeur / seuil);
  return (
    <div>
      <div className="barre-boutons" style={{ justifyContent: 'space-between' }}>
        <span className="petit">{libelle}</span>
        <span className="petit nombre">{euros(valeur)} sur {euros(seuil)}</span>
      </div>
      <div className={`jauge${ratio >= 1 ? ' bloquant' : ratio >= 0.8 ? ' attention' : ''}`}><div style={{ width: `${ratio * 100}%` }} /></div>
      <small className="discret">{aide}</small>
    </div>
  );
}

export function PageComptes() {
  const { lots, profil } = useDonnees();
  const annees = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear()]);
    lots.forEach((l) => {
      if (l.achat) s.add(Number(l.achat.date.slice(0, 4)));
      if (l.vente) s.add(Number(l.vente.date.slice(0, 4)));
    });
    return [...s].sort((a, b) => b - a);
  }, [lots]);
  const [annee, setAnnee] = useState(annees[0]);
  const [registre, setRegistre] = useState<Registre>('recettes');
  const b = bilanAnnee(lots, profil, annee);
  const taux = tauxPrelevementsPct(profil);

  const recettes = lignesRecettes(lots, annee);
  const achats = lignesAchats(lots, annee);
  const objets = lignesObjets(lots).filter((o) => o.lot.achat!.date.startsWith(String(annee)));

  const exporter = () => {
    const nom = { recettes: 'livre-des-recettes', achats: 'registre-des-achats', objets: 'registre-objets-mobiliers' }[registre];
    const csv =
      registre === 'recettes' ? versCsv(COLONNES_RECETTES, recettes) : registre === 'achats' ? versCsv(COLONNES_ACHATS, achats) : versCsv(COLONNES_OBJETS, objets);
    telechargerFichier(`${nom}-${annee}.csv`, csv, 'text/csv;charset=utf-8');
  };

  return (
    <div className="pile">
      <div className="titre-page ne-pas-imprimer">
        <div>
          <h1>Comptes</h1>
          <p className="discret">Chiffre d’affaires à déclarer, seuils de la micro-entreprise et registres préparés à partir de vos lots.</p>
        </div>
        <label className="champ" style={{ width: 140 }}>
          <span>Année</span>
          <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>{annees.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        </label>
      </div>

      <div className="grille-2 ne-pas-imprimer">
        <section className="panneau">
          <h2>À déclarer à l’URSSAF</h2>
          <table className="chiffres">
            <tbody>
              {b.parTrimestre.map((ca, i) => (
                <tr key={i}>
                  <td>{['Janvier à mars', 'Avril à juin', 'Juillet à septembre', 'Octobre à décembre'][i]}</td>
                  <td>{euros(ca, 2)} <span className="discret petit">→ {euros((ca * taux) / 100, 2)}</span></td>
                </tr>
              ))}
              <tr className="total"><td>Total {annee}</td><td>{euros(b.chiffreAffaires, 2)}</td></tr>
            </tbody>
          </table>
          <p className="petit discret" style={{ marginTop: 10 }}>
            Déclarez le chiffre d’affaires encaissé (vente de marchandises), même s’il est nul. Prélèvements estimés à {pct(taux, 1)} :
            cotisations {pct(profil.tauxCotisationsPct, 1)}, formation professionnelle {pct(profil.tauxCfpPct, 1)}
            {profil.versementLiberatoire && <>, impôt {pct(profil.tauxVersementLiberatoirePct, 1)}</>}. Taux modifiables dans Réglages.
          </p>
        </section>

        <section className="panneau pile">
          <h2>Seuils de la micro-entreprise</h2>
          <Jauge libelle="Franchise de TVA" valeur={b.chiffreAffaires} seuil={SEUILS.franchiseTvaBase} aide={`Au-delà, TVA à facturer l’année suivante ; au-delà de ${euros(SEUILS.franchiseTvaMajore)}, immédiatement.`} />
          <Jauge libelle="Plafond de la micro-entreprise" valeur={b.chiffreAffaires} seuil={SEUILS.plafondMicro} aide="Seuils 2026 pour la vente de marchandises." />
          {alertesSeuils(b.chiffreAffaires).map((a) => <div key={a.message} className={`alerte ${a.niveau}`}>{a.message}</div>)}
          <table className="chiffres">
            <tbody>
              <tr><td>Achats payés en {annee} (frais compris)</td><td>{euros(b.achats)}</td></tr>
              <tr><td>Transport, réparations, autres</td><td>{euros(b.autresCouts)}</td></tr>
              <tr><td>URSSAF estimée</td><td>{euros(b.prelevements)}</td></tr>
              <tr className="total"><td>Gain net</td><td className={b.margeNette >= 0 ? 'positif' : 'negatif'}>{euros(b.margeNette)}</td></tr>
            </tbody>
          </table>
          <p className="petit discret" style={{ margin: 0 }}>Les achats comptent dès leur paiement, même si le lot est encore en stock ({euros(b.stockValeur)}).</p>
        </section>
      </div>

      <section className="panneau">
        <div className="panneau-entete ne-pas-imprimer">
          <div className="onglets-filtre" role="group" aria-label="Registre">
            {([['recettes', 'Livre des recettes', recettes.length], ['achats', 'Registre des achats', achats.length], ['objets', 'Registre des objets mobiliers', objets.length]] as const).map(([id, libelle, n]) => (
              <button key={id} type="button" aria-pressed={registre === id} onClick={() => setRegistre(id)}>{libelle}<b>{n}</b></button>
            ))}
          </div>
          <div className="barre-boutons">
            <button className="bouton petit" onClick={exporter}><IcExport /> Exporter (Excel)</button>
            <button className="bouton petit" onClick={() => window.print()}><IcImprimer /> Imprimer</button>
          </div>
        </div>
        <h2 style={{ marginBottom: 10 }}>
          {{ recettes: 'Livre des recettes', achats: 'Registre des achats', objets: 'Registre des objets mobiliers' }[registre]} {annee}
          {profil.nom && <span className="discret petit" style={{ fontWeight: 400 }}> — {profil.nom}{profil.siret && `, SIRET ${profil.siret}`}</span>}
        </h2>
        {registre === 'recettes' && (recettes.length ? <Tableau colonnes={COLONNES_RECETTES} lignes={recettes} cle={(l) => l.lot.id} /> : <p className="discret">Aucune vente encaissée en {annee}.</p>)}
        {registre === 'achats' && (achats.length ? <Tableau colonnes={COLONNES_ACHATS} lignes={achats} cle={(l) => l.lot.id} /> : <p className="discret">Aucun achat payé en {annee}.</p>)}
        {registre === 'objets' && (objets.length ? <Tableau colonnes={COLONNES_OBJETS} lignes={objets} cle={(l) => l.lot.id} /> : <p className="discret">Aucun objet acquis en {annee}.</p>)}
        <p className="petit discret ne-pas-imprimer" style={{ marginTop: 12 }}>
          {registre === 'objets'
            ? 'Le registre des objets mobiliers doit être tenu chaque jour, sans rature, et conservé : sur papier à l’encre (5 ans), ou dans un logiciel qui empêche toute modification (10 ans). Cette appli ne remplit pas cette condition : recopiez ces lignes dans votre registre officiel. Le modèle exact est fixé par l’arrêté du 15 mai 2020.'
            : 'Tenez ces registres dans l’ordre chronologique et gardez les pièces justificatives (bordereaux du Domaine, factures de vente).'}
        </p>
      </section>
    </div>
  );
}
