import { useEffect, useRef, useState } from 'react';
import { ChampChoix, ChampNombre, ChampTexte } from '../composants/Champs';
import { IcRetour } from '../composants/Icones';
import { aller, useDonnees } from '../contexte';
import { delaiLisible } from '../lib/affichage';
import { chiffrer, estimationRevente, euros, FRAIS_ACHETEUR_PCT, pct, resultatReel, tauxPrelevementsPct } from '../lib/calculs';
import { VERIFICATIONS_LOT, VERIFICATIONS_VEHICULE } from '../lib/guide';
import { compresserPhoto } from '../lib/image';
import { aujourdhui, nouvelId } from '../lib/store';
import { CATEGORIES, MODES_PAIEMENT, STATUTS, type Achat, type Lot, type ModePaiement, type Statut, type Vente } from '../types';

const STATUTS_ACHAT: Statut[] = ['Gagné', 'Retiré', 'En vente', 'Vendu'];

export function FicheLot({ lot }: { lot: Lot }) {
  const { enregistrerLot, supprimerLot, profil, notifier } = useDonnees();
  const [l, setL] = useState<Lot>(lot);
  const [nouveauComp, setNouveauComp] = useState({ titre: '', prix: undefined as number | undefined, url: '', vendu: false });
  const [nouvelEvenement, setNouvelEvenement] = useState('');

  // Enregistrement automatique (regroupé), forcé en quittant la fiche.
  const premier = useRef(true);
  const dernier = useRef(l);
  const aEnregistrer = useRef(false);
  const supprime = useRef(false);
  useEffect(() => {
    setL(lot);
    premier.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lot.id]);
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    dernier.current = l;
    aEnregistrer.current = true;
    const t = setTimeout(() => {
      if (supprime.current) return;
      enregistrerLot(l);
      aEnregistrer.current = false;
    }, 500);
    return () => clearTimeout(t);
  }, [l, enregistrerLot]);
  useEffect(() => () => {
    if (aEnregistrer.current && !supprime.current) enregistrerLot(dernier.current);
  }, [enregistrerLot]);

  const maj = (p: Partial<Lot>) => setL((x) => ({ ...x, ...p }));
  const majAchat = (p: Partial<Achat>) => setL((x) => ({ ...x, achat: { ...x.achat!, ...p } }));
  const majVente = (p: Partial<Vente>) => setL((x) => ({ ...x, vente: { ...x.vente!, ...p } }));
  const num = (v: number | undefined) => v ?? 0;

  const c = chiffrer(l, profil);
  const r = resultatReel(l, profil);
  const estimation = estimationRevente(l.comparables, l.decotePct);

  const changerStatut = (s: Statut) => {
    if (s === l.statut) return;
    setL((x) => {
      const suivant: Lot = { ...x, statut: s, journal: [...x.journal, { id: nouvelId(), date: aujourdhui(), texte: `Étape : ${s}` }] };
      if (STATUTS_ACHAT.includes(s) && !x.achat) {
        const prix = x.prixActuel ?? c.enchereMax;
        suivant.achat = {
          date: aujourdhui(),
          prixAdjuge: prix,
          fraisAcheteur: Math.round(prix * FRAIS_ACHETEUR_PCT[x.modeVente]) / 100,
          refPiece: '',
          modePaiement: 'Virement',
          vendeur: `État — Domaine (DNID)${x.refVente ? `, vente ${x.refVente}` : ''}`,
        };
      }
      if (s === 'Vendu' && !x.vente) {
        suivant.vente = {
          date: aujourdhui(),
          prix: c.prixRevente ?? 0,
          plateforme: 'Leboncoin',
          modePaiement: 'Paiement en ligne (plateforme)',
          acheteur: '',
          refPiece: '',
          fraisVente: Math.round(c.fraisPlateforme * 100) / 100,
        };
      }
      return suivant;
    });
  };

  const ajouterComparable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauComp.prix) return;
    maj({ comparables: [...l.comparables, { id: nouvelId(), titre: nouveauComp.titre.trim(), prix: nouveauComp.prix, url: nouveauComp.url.trim(), vendu: nouveauComp.vendu }] });
    setNouveauComp({ titre: '', prix: undefined, url: '', vendu: false });
  };

  const ajouterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    try {
      const nouvelles = await Promise.all([...fichiers].map((f) => compresserPhoto(f)));
      setL((x) => ({ ...x, photos: [...x.photos, ...nouvelles] }));
    } catch (e) {
      notifier((e as Error).message);
    }
  };

  const vehicule = l.categorie === 'Véhicule' || l.categorie === 'Deux-roues';
  const rechercheLbc = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(l.titre)}`;
  const journalTrie = [...l.journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="pile">
      <div className="barre-boutons" style={{ justifyContent: 'space-between' }}>
        <a className="bouton petit" href="#/lots"><IcRetour /> Mes lots</a>
        {l.urlAnnonce && <a className="bouton petit" href={l.urlAnnonce} target="_blank" rel="noreferrer">Ouvrir l’annonce</a>}
      </div>

      <input
        aria-label="Nom du lot"
        value={l.titre}
        onChange={(e) => maj({ titre: e.target.value })}
        placeholder="Nom du lot, ex. Perceuse-visseuse Makita 18 V"
        style={{ font: '700 1.75rem/1.2 var(--police)', fontStretch: '112%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--trait)', borderRadius: 0, padding: '4px 0' }}
      />

      <div className="etapes" role="group" aria-label="Étape du lot">
        {STATUTS.map((s) => (
          <button key={s} type="button" aria-pressed={l.statut === s} onClick={() => changerStatut(s)}>{s}</button>
        ))}
      </div>

      <div className="grille-fiche">
        <div className="pile">
          <section className="panneau">
            <fieldset>
              <legend>L’annonce</legend>
              <div className="grille-champs">
                <ChampChoix libelle="Catégorie" valeur={l.categorie} options={CATEGORIES} onChange={(v) => maj({ categorie: v })} />
                <ChampChoix
                  libelle="Type de vente"
                  valeur={l.modeVente}
                  options={[{ valeur: 'encheres', libelle: 'Enchères (frais 11 %)' }, { valeur: 'appel-offres', libelle: 'Appel d’offres (frais 6 %)' }]}
                  onChange={(v) => maj({ modeVente: v })}
                />
                <ChampNombre libelle="Mise à prix ou enchère actuelle" valeur={l.prixActuel} onChange={(v) => maj({ prixActuel: v })} unite="€" />
                <label className="champ">
                  <span>Clôture de la vente</span>
                  <input type="datetime-local" value={l.dateCloture ?? ''} onChange={(e) => maj({ dateCloture: e.target.value || undefined })} />
                  {l.dateCloture && <small>{delaiLisible(l.dateCloture)}</small>}
                </label>
                <ChampTexte libelle="Référence de la vente" valeur={l.refVente} onChange={(v) => maj({ refVente: v })} />
                <ChampTexte libelle="Numéro du lot" valeur={l.numeroLot} onChange={(v) => maj({ numeroLot: v })} />
                <ChampTexte libelle="Lieu de retrait" valeur={l.lieuRetrait} onChange={(v) => maj({ lieuRetrait: v })} placeholder="Ville" />
                <ChampTexte libelle="Numéro de série ou d’immatriculation" valeur={l.numeroSerie} onChange={(v) => maj({ numeroSerie: v })} />
              </div>
              <div className="pile" style={{ marginTop: 12 }}>
                <ChampTexte libelle="Lien de l’annonce" type="url" valeur={l.urlAnnonce} onChange={(v) => maj({ urlAnnonce: v })} placeholder="https://encheres-domaine.gouv.fr/…" />
                <ChampTexte libelle="Description et état" valeur={l.description} onChange={(v) => maj({ description: v })} multiligne lignes={3} placeholder="Marque, modèle, état annoncé, accessoires…" />
              </div>
            </fieldset>
          </section>

          <section className="panneau">
            <fieldset>
              <legend>À combien le revendre ?</legend>
              <p className="petit discret">
                Relevez au moins trois annonces du même objet. Cochez « vendu » quand le prix est celui d’une vente conclue :
                les simples prix demandés sont réduits de la décote de prudence.
              </p>
              <p className="petit"><a href={rechercheLbc} target="_blank" rel="noreferrer">Chercher « {l.titre || 'ce lot'} » sur Leboncoin</a></p>
              <ul className="comparables">
                {l.comparables.map((cp) => (
                  <li key={cp.id}>
                    {cp.url ? <a href={cp.url} target="_blank" rel="noreferrer">{cp.titre || cp.url}</a> : <span className="titre">{cp.titre || 'Annonce'}</span>}
                    <span className="nombre" style={{ textAlign: 'right', fontWeight: 600 }}>{euros(cp.prix)}</span>
                    <label className="case petit vendu-case">
                      <input type="checkbox" checked={cp.vendu} onChange={(e) => maj({ comparables: l.comparables.map((x) => (x.id === cp.id ? { ...x, vendu: e.target.checked } : x)) })} />
                      vendu
                    </label>
                    <button className="bouton petit" aria-label="Retirer" onClick={() => maj({ comparables: l.comparables.filter((x) => x.id !== cp.id) })}>×</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={ajouterComparable} className="grille-champs" style={{ alignItems: 'end', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto' }}>
                <ChampTexte libelle="Annonce comparable" valeur={nouveauComp.titre} onChange={(v) => setNouveauComp((x) => ({ ...x, titre: v }))} placeholder="Titre ou lien" />
                <ChampNombre libelle="Prix" valeur={nouveauComp.prix} onChange={(v) => setNouveauComp((x) => ({ ...x, prix: v }))} unite="€" />
                <button className="bouton" type="submit" disabled={!nouveauComp.prix}>Ajouter</button>
                <div style={{ gridColumn: '1 / -1' }} className="barre-boutons">
                  <input aria-label="Lien de l’annonce comparable" placeholder="Lien (facultatif)" value={nouveauComp.url} onChange={(e) => setNouveauComp((x) => ({ ...x, url: e.target.value }))} style={{ flex: 1, minWidth: 200 }} />
                  <label className="case petit"><input type="checkbox" checked={nouveauComp.vendu} onChange={(e) => setNouveauComp((x) => ({ ...x, vendu: e.target.checked }))} /> Prix de vente conclue</label>
                </div>
              </form>
              <div className="grille-champs" style={{ marginTop: 14 }}>
                <ChampNombre libelle="Décote de prudence" valeur={l.decotePct} onChange={(v) => maj({ decotePct: num(v) })} unite="%" aide="Sur les prix demandés" />
                <ChampNombre
                  libelle="Prix de revente retenu"
                  valeur={l.prixReventeManuel}
                  onChange={(v) => maj({ prixReventeManuel: v })}
                  unite="€"
                  aide={estimation ? `Estimation des comparables : ${euros(estimation)}. Laissez vide pour l’utiliser.` : 'Laissez vide pour utiliser les comparables.'}
                />
              </div>
            </fieldset>
          </section>

          <section className="panneau">
            <fieldset>
              <legend>Coûts et marge</legend>
              <div className="grille-champs">
                <ChampNombre libelle="Transport et retrait" valeur={l.transport} onChange={(v) => maj({ transport: num(v) })} unite="€" aide="Carburant, péage, location d’utilitaire" />
                <ChampNombre libelle="Réparation, nettoyage" valeur={l.reparation} onChange={(v) => maj({ reparation: num(v) })} unite="€" />
                <ChampNombre libelle="Autres frais" valeur={l.autresFrais} onChange={(v) => maj({ autresFrais: num(v) })} unite="€" aide={vehicule ? 'Carte grise, contrôle technique…' : 'Pièces, emballage…'} />
                <ChampNombre libelle="Commission de la plateforme" valeur={l.fraisPlateformePct} onChange={(v) => maj({ fraisPlateformePct: num(v) })} unite="%" />
                <ChampNombre libelle="Frais fixes de vente" valeur={l.fraisPlateformeFixe} onChange={(v) => maj({ fraisPlateformeFixe: num(v) })} unite="€" aide="Envoi offert, mise en avant…" />
                <ChampNombre libelle="Marge minimale" valeur={l.margeMinEuros} onChange={(v) => maj({ margeMinEuros: num(v) })} unite="€" />
                <ChampNombre libelle="Marge visée" valeur={l.margeMinPct} onChange={(v) => maj({ margeMinPct: num(v) })} unite="%" aide="Du prix de revente" />
              </div>
            </fieldset>
          </section>

          <section className="panneau">
            <fieldset>
              <legend>Avant d’enchérir</legend>
              <ul className="verifs">
                {(vehicule ? [...VERIFICATIONS_LOT, ...VERIFICATIONS_VEHICULE] : VERIFICATIONS_LOT).map((v) => <li key={v}>{v}</li>)}
              </ul>
            </fieldset>
          </section>

          <section className="panneau">
            <fieldset>
              <legend>Photos et notes</legend>
              <div className="photos">
                {l.photos.map((src, i) => (
                  <div className="photo" key={i}>
                    <img src={src} alt={`Photo ${i + 1}`} />
                    <button aria-label="Supprimer la photo" onClick={() => maj({ photos: l.photos.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <label className="ajout-photo">
                  Ajouter des photos
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => { ajouterPhotos(e.target.files); e.target.value = ''; }} />
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <ChampTexte libelle="Notes" valeur={l.notes} onChange={(v) => maj({ notes: v })} multiligne lignes={3} />
              </div>
            </fieldset>
          </section>
        </div>

        <div className="pile colle">
          <section className="panneau">
            {c.prixRevente ? (
              <>
                <div className={`etiquette-lot grande${c.enchereMax <= 0 ? ' vide' : ''}`}>
                  <small>Enchère maximale</small>
                  <b className="nombre">{c.enchereMax > 0 ? euros(c.enchereMax) : 'Ne pas enchérir'}</b>
                  {c.enchereMax > 0 && <small>soit {euros(c.coutTotalEnchereMax)} avec frais et coûts</small>}
                </div>
                {c.enchereMax <= 0 && <p className="petit" style={{ marginTop: 10 }}>Même à 0 €, la marge visée n’est pas atteinte avec ce prix de revente.</p>}
                <table className="chiffres" style={{ marginTop: 14 }}>
                  <tbody>
                    <tr><td>Prix de revente {c.source === 'comparables' ? 'estimé' : 'retenu'}</td><td>{euros(c.prixRevente)}</td></tr>
                    {c.fraisPlateforme > 0 && <tr><td>Frais de vente</td><td>− {euros(c.fraisPlateforme)}</td></tr>}
                    <tr><td>URSSAF ({pct(tauxPrelevementsPct(profil), 1)})</td><td>− {euros(c.prelevements)}</td></tr>
                    <tr><td>Coûts annexes</td><td>− {euros(c.coutsAnnexes)}</td></tr>
                    <tr><td>Marge visée</td><td>− {euros(c.margeVisee)}</td></tr>
                    <tr><td>Frais acheteur du Domaine</td><td>{c.fraisAcheteurPct} % du prix</td></tr>
                  </tbody>
                </table>
                {c.prixReference != null && c.margeReference != null && !l.vente && (
                  <div className={`alerte ${c.margeReference >= c.margeVisee ? 'ok' : c.margeReference > 0 ? 'attention' : 'bloquant'}`} style={{ marginTop: 12 }}>
                    {l.achat ? 'Au prix payé' : 'Au prix actuel'} de {euros(c.prixReference)} : marge de <strong>{euros(c.margeReference)}</strong>
                    {c.margeReferencePct != null && <> ({pct(c.margeReferencePct)} du coût)</>}.
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="etiquette-lot vide"><small>Enchère maximale</small><b>?</b></div>
                <p className="petit discret" style={{ marginTop: 10 }}>Ajoutez des annonces comparables ou un prix de revente pour la calculer.</p>
              </div>
            )}
          </section>

          {l.achat && (
            <section className="panneau">
              <fieldset>
                <legend>Achat</legend>
                <div className="grille-champs" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
                  <label className="champ"><span>Date du paiement</span><input type="date" value={l.achat.date} onChange={(e) => majAchat({ date: e.target.value })} /></label>
                  <ChampNombre libelle="Prix adjugé" valeur={l.achat.prixAdjuge} onChange={(v) => majAchat({ prixAdjuge: num(v), fraisAcheteur: Math.round(num(v) * c.fraisAcheteurPct) / 100 })} unite="€" />
                  <ChampNombre libelle="Frais acheteur" valeur={l.achat.fraisAcheteur} onChange={(v) => majAchat({ fraisAcheteur: num(v) })} unite="€" />
                  <ChampTexte libelle="N° de bordereau ou facture" valeur={l.achat.refPiece} onChange={(v) => majAchat({ refPiece: v })} />
                  <ChampChoix<ModePaiement> libelle="Paiement" valeur={l.achat.modePaiement} options={MODES_PAIEMENT} onChange={(v) => majAchat({ modePaiement: v })} />
                  <ChampTexte libelle="Vendeur" valeur={l.achat.vendeur} onChange={(v) => majAchat({ vendeur: v })} />
                </div>
                <p className="petit discret" style={{ marginTop: 8 }}>Ces informations alimentent le registre des achats et le registre des objets mobiliers.</p>
              </fieldset>
            </section>
          )}

          {l.vente && (
            <section className="panneau">
              <fieldset>
                <legend>Revente</legend>
                <div className="grille-champs" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
                  <label className="champ"><span>Date d’encaissement</span><input type="date" value={l.vente.date} onChange={(e) => majVente({ date: e.target.value })} /></label>
                  <ChampNombre libelle="Prix de vente" valeur={l.vente.prix} onChange={(v) => majVente({ prix: num(v) })} unite="€" />
                  <ChampNombre libelle="Frais de vente payés" valeur={l.vente.fraisVente} onChange={(v) => majVente({ fraisVente: num(v) })} unite="€" />
                  <ChampTexte libelle="Plateforme" valeur={l.vente.plateforme} onChange={(v) => majVente({ plateforme: v })} />
                  <ChampChoix<ModePaiement> libelle="Encaissement" valeur={l.vente.modePaiement} options={MODES_PAIEMENT} onChange={(v) => majVente({ modePaiement: v })} />
                  <ChampTexte libelle="N° de facture" valeur={l.vente.refPiece} onChange={(v) => majVente({ refPiece: v })} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <ChampTexte libelle="Client" valeur={l.vente.acheteur} onChange={(v) => majVente({ acheteur: v })} placeholder="Nom, ou « Particulier »" />
                </div>
              </fieldset>
              {r && (
                <table className="chiffres" style={{ marginTop: 14 }}>
                  <tbody>
                    <tr><td>Coût du lot</td><td>{euros(r.cout)}</td></tr>
                    <tr><td>URSSAF</td><td>{euros(r.prelevements)}</td></tr>
                    <tr className="total"><td>Ce que le lot a rapporté</td><td className={r.marge >= 0 ? 'positif' : 'negatif'}>{euros(r.marge)}</td></tr>
                  </tbody>
                </table>
              )}
            </section>
          )}

          <section className="panneau">
            <fieldset>
              <legend>Journal</legend>
              <form
                className="barre-boutons"
                style={{ flexWrap: 'nowrap', marginBottom: 12 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nouvelEvenement.trim()) return;
                  maj({ journal: [...l.journal, { id: nouvelId(), date: aujourdhui(), texte: nouvelEvenement.trim() }] });
                  setNouvelEvenement('');
                }}
              >
                <input aria-label="Nouvelle note" value={nouvelEvenement} onChange={(e) => setNouvelEvenement(e.target.value)} placeholder="Visite de l’exposition, enchère placée…" />
                <button className="bouton" type="submit">Noter</button>
              </form>
              <ul className="journal">
                {journalTrie.map((e) => (
                  <li key={e.id}><time dateTime={e.date}>{new Date(e.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</time>{e.texte}</li>
                ))}
              </ul>
            </fieldset>
          </section>

          <div className="barre-boutons" style={{ justifyContent: 'flex-end' }}>
            <button
              className="bouton danger"
              onClick={() => {
                if (!window.confirm('Supprimer définitivement ce lot ? S’il a été acheté, il disparaîtra aussi des registres.')) return;
                supprime.current = true;
                supprimerLot(l.id);
                notifier('Lot supprimé');
                aller('lots');
              }}
            >
              Supprimer ce lot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
