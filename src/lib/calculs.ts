// Calculs du carnet de revente. Fonctions pures, testées dans tests/calculs.test.ts.
import type { Comparable, Lot, ModeVente, Profil } from '../types';

/** Frais de vente payés par l'acheteur en sus du prix adjugé (ventes du Domaine). */
export const FRAIS_ACHETEUR_PCT: Record<ModeVente, number> = {
  encheres: 11,
  'appel-offres': 6,
};

/** Seuils 2026-2028 pour la vente de marchandises (micro-entreprise). */
export const SEUILS = {
  plafondMicro: 203_100,
  franchiseTvaBase: 85_000,
  franchiseTvaMajore: 93_500,
};

export const PROFIL_DEFAUT: Profil = {
  nom: '',
  adresse: '',
  siret: '',
  telephone: '',
  email: '',
  tauxCotisationsPct: 12.3,
  tauxCfpPct: 0.1,
  versementLiberatoire: false,
  tauxVersementLiberatoirePct: 1,
  margeMinEurosDefaut: 40,
  margeMinPctDefaut: 25,
};

/** Part du prix de vente prélevée par l'URSSAF (cotisations + CFP + impôt si versement libératoire). */
export function tauxPrelevementsPct(p: Profil): number {
  return p.tauxCotisationsPct + p.tauxCfpPct + (p.versementLiberatoire ? p.tauxVersementLiberatoirePct : 0);
}

export function mediane(valeurs: number[]): number | undefined {
  const v = valeurs.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (v.length === 0) return undefined;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/**
 * Prix de revente estimé. Les ventes constatées comptent telles quelles ;
 * les prix demandés sont surestimés : on applique la décote de prudence.
 */
export function estimationRevente(comparables: Comparable[], decotePct: number): number | undefined {
  const prix = comparables.map((c) => (c.vendu ? c.prix : c.prix * (1 - decotePct / 100)));
  const m = mediane(prix);
  return m === undefined ? undefined : Math.round(m);
}

export interface Chiffrage {
  prixRevente?: number;
  source: 'manuel' | 'comparables' | 'aucune';
  fraisPlateforme: number;
  prelevements: number; // URSSAF sur le prix de vente
  recetteNette: number; // ce qui reste de la vente
  coutsAnnexes: number; // transport + réparation + autres
  margeVisee: number;
  enchereMax: number; // prix adjugé à ne pas dépasser (hors frais acheteur)
  coutTotalEnchereMax: number; // ce que coûte le lot à ce prix, frais compris
  fraisAcheteurPct: number;
  // si un prix est connu (enchère en cours ou adjugé)
  prixReference?: number;
  coutTotalReference?: number;
  margeReference?: number;
  margeReferencePct?: number;
}

export function chiffrer(lot: Lot, profil: Profil): Chiffrage {
  const fraisAcheteurPct = FRAIS_ACHETEUR_PCT[lot.modeVente];
  const estimation = estimationRevente(lot.comparables, lot.decotePct);
  const prixRevente = lot.prixReventeManuel ?? estimation;
  const source = lot.prixReventeManuel != null ? 'manuel' : estimation != null ? 'comparables' : 'aucune';
  const pv = prixRevente ?? 0;
  const fraisPlateforme = pv > 0 ? (pv * lot.fraisPlateformePct) / 100 + lot.fraisPlateformeFixe : 0;
  const prelevements = (pv * tauxPrelevementsPct(profil)) / 100;
  const recetteNette = pv - fraisPlateforme - prelevements;
  const coutsAnnexes = lot.transport + lot.reparation + lot.autresFrais;
  const margeVisee = Math.max(lot.margeMinEuros, (pv * lot.margeMinPct) / 100);
  const enchereBrute = (recetteNette - coutsAnnexes - margeVisee) / (1 + fraisAcheteurPct / 100);
  const enchereMax = pv > 0 ? Math.max(0, Math.floor(enchereBrute)) : 0;
  const coutTotalEnchereMax = enchereMax * (1 + fraisAcheteurPct / 100) + coutsAnnexes;

  const prixReference = lot.achat?.prixAdjuge ?? lot.prixActuel;
  let coutTotalReference: number | undefined;
  let margeReference: number | undefined;
  let margeReferencePct: number | undefined;
  if (prixReference != null) {
    const fraisPayes = lot.achat?.fraisAcheteur ?? (prixReference * fraisAcheteurPct) / 100;
    coutTotalReference = prixReference + fraisPayes + coutsAnnexes;
    if (pv > 0) {
      margeReference = recetteNette - coutTotalReference;
      margeReferencePct = coutTotalReference > 0 ? (margeReference / coutTotalReference) * 100 : undefined;
    }
  }

  return {
    prixRevente, source, fraisPlateforme, prelevements, recetteNette, coutsAnnexes, margeVisee,
    enchereMax, coutTotalEnchereMax, fraisAcheteurPct, prixReference, coutTotalReference, margeReference, margeReferencePct,
  };
}

/** Résultat réel d'un lot vendu : ce qu'il a vraiment rapporté. */
export function resultatReel(lot: Lot, profil: Profil) {
  if (!lot.achat || !lot.vente) return undefined;
  const cout = lot.achat.prixAdjuge + lot.achat.fraisAcheteur + lot.transport + lot.reparation + lot.autresFrais;
  const prelevements = (lot.vente.prix * tauxPrelevementsPct(profil)) / 100;
  const marge = lot.vente.prix - lot.vente.fraisVente - prelevements - cout;
  return { cout, prelevements, marge };
}

export interface Bilan {
  annee: number;
  chiffreAffaires: number;
  achats: number; // prix + frais acheteur des lots payés dans l'année
  autresCouts: number;
  prelevements: number;
  margeNette: number;
  stockValeur: number; // lots achetés pas encore vendus (prix de revient)
  stockNombre: number;
  vendus: number;
  parTrimestre: number[]; // chiffre d'affaires par trimestre
}

export function bilanAnnee(lots: Lot[], profil: Profil, annee: number): Bilan {
  const dansAnnee = (d?: string) => !!d && d.startsWith(String(annee));
  const parTrimestre = [0, 0, 0, 0];
  let chiffreAffaires = 0, achats = 0, autresCouts = 0, fraisVente = 0, stockValeur = 0, stockNombre = 0, vendus = 0;
  for (const l of lots) {
    if (l.achat && dansAnnee(l.achat.date)) {
      achats += l.achat.prixAdjuge + l.achat.fraisAcheteur;
      autresCouts += l.transport + l.reparation + l.autresFrais;
    }
    if (l.vente && dansAnnee(l.vente.date)) {
      chiffreAffaires += l.vente.prix;
      fraisVente += l.vente.fraisVente;
      vendus++;
      parTrimestre[Math.floor((Number(l.vente.date.slice(5, 7)) - 1) / 3)] += l.vente.prix;
    }
    if (l.achat && !l.vente) {
      stockNombre++;
      stockValeur += l.achat.prixAdjuge + l.achat.fraisAcheteur + l.transport + l.reparation + l.autresFrais;
    }
  }
  const prelevements = (chiffreAffaires * tauxPrelevementsPct(profil)) / 100;
  return {
    annee, chiffreAffaires, achats, autresCouts, prelevements,
    margeNette: chiffreAffaires - fraisVente - prelevements - achats - autresCouts,
    stockValeur, stockNombre, vendus, parTrimestre,
  };
}

export function alertesSeuils(chiffreAffaires: number): { niveau: 'info' | 'attention' | 'bloquant'; message: string }[] {
  const a: { niveau: 'info' | 'attention' | 'bloquant'; message: string }[] = [];
  if (chiffreAffaires > SEUILS.franchiseTvaMajore) {
    a.push({ niveau: 'bloquant', message: `Chiffre d’affaires au-dessus de ${euros(SEUILS.franchiseTvaMajore)} : la TVA est due dès le jour du dépassement. Contactez votre service des impôts des entreprises.` });
  } else if (chiffreAffaires > SEUILS.franchiseTvaBase) {
    a.push({ niveau: 'attention', message: `Chiffre d’affaires au-dessus de ${euros(SEUILS.franchiseTvaBase)} : vous perdrez la franchise de TVA au 1er janvier prochain.` });
  } else if (chiffreAffaires > SEUILS.franchiseTvaBase * 0.8) {
    a.push({ niveau: 'info', message: `Vous approchez du seuil de franchise de TVA (${euros(SEUILS.franchiseTvaBase)}).` });
  }
  if (chiffreAffaires > SEUILS.plafondMicro) {
    a.push({ niveau: 'bloquant', message: `Plafond de la micro-entreprise (${euros(SEUILS.plafondMicro)}) dépassé.` });
  }
  return a;
}

export const euros = (n: number | undefined, decimales = 0) =>
  n == null || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimales, minimumFractionDigits: decimales });

export const pct = (n: number | undefined, decimales = 0) =>
  n == null || !Number.isFinite(n) ? '—' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: decimales, minimumFractionDigits: decimales })} %`;
