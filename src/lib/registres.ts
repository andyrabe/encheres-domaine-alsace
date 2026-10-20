// Préparation des registres de la micro-entreprise à partir des lots.
// L'appli aide à les remplir ; le registre officiel reste celui que vous tenez
// (papier à l'encre, ou logiciel inaltérable pour le registre des objets mobiliers).
import type { Lot } from '../types';

export interface Colonne<T> {
  titre: string;
  valeur: (ligne: T) => string | number;
  montant?: boolean;
}

export interface LigneRecette { lot: Lot }
export interface LigneAchat { lot: Lot }
export interface LigneObjet { lot: Lot; numeroOrdre: number }

const designation = (l: Lot) =>
  [l.titre, l.categorie !== 'Divers' ? `(${l.categorie.toLowerCase()})` : '', l.numeroSerie ? `n° de série ${l.numeroSerie}` : '']
    .filter(Boolean)
    .join(' ');

const dateFr = (iso: string) => (iso ? new Date(iso + 'T12:00').toLocaleDateString('fr-FR') : '');

export function lignesRecettes(lots: Lot[], annee?: number): LigneRecette[] {
  return lots
    .filter((l) => l.vente && (!annee || l.vente.date.startsWith(String(annee))))
    .sort((a, b) => a.vente!.date.localeCompare(b.vente!.date))
    .map((lot) => ({ lot }));
}

export function lignesAchats(lots: Lot[], annee?: number): LigneAchat[] {
  return lots
    .filter((l) => l.achat && (!annee || l.achat.date.startsWith(String(annee))))
    .sort((a, b) => a.achat!.date.localeCompare(b.achat!.date))
    .map((lot) => ({ lot }));
}

/** Numéros d'ordre continus, dans l'ordre des acquisitions, toutes années confondues. */
export function lignesObjets(lots: Lot[]): LigneObjet[] {
  return lots
    .filter((l) => l.achat)
    .sort((a, b) => a.achat!.date.localeCompare(b.achat!.date) || a.creeLe.localeCompare(b.creeLe))
    .map((lot, i) => ({ lot, numeroOrdre: i + 1 }));
}

export const COLONNES_RECETTES: Colonne<LigneRecette>[] = [
  { titre: 'Date d’encaissement', valeur: ({ lot }) => dateFr(lot.vente!.date) },
  { titre: 'Pièce justificative', valeur: ({ lot }) => lot.vente!.refPiece },
  { titre: 'Client', valeur: ({ lot }) => lot.vente!.acheteur || 'Particulier' },
  { titre: 'Nature de la vente', valeur: ({ lot }) => designation(lot) },
  { titre: 'Montant', valeur: ({ lot }) => lot.vente!.prix, montant: true },
  { titre: 'Mode de règlement', valeur: ({ lot }) => lot.vente!.modePaiement },
];

export const COLONNES_ACHATS: Colonne<LigneAchat>[] = [
  { titre: 'Date du règlement', valeur: ({ lot }) => dateFr(lot.achat!.date) },
  { titre: 'Pièce justificative', valeur: ({ lot }) => lot.achat!.refPiece },
  { titre: 'Fournisseur', valeur: ({ lot }) => lot.achat!.vendeur },
  { titre: 'Nature de l’achat', valeur: ({ lot }) => designation(lot) },
  { titre: 'Montant', valeur: ({ lot }) => lot.achat!.prixAdjuge + lot.achat!.fraisAcheteur, montant: true },
  { titre: 'Mode de paiement', valeur: ({ lot }) => lot.achat!.modePaiement },
];

export const COLONNES_OBJETS: Colonne<LigneObjet>[] = [
  { titre: 'N° d’ordre', valeur: (l) => l.numeroOrdre },
  { titre: 'Date d’acquisition', valeur: ({ lot }) => dateFr(lot.achat!.date) },
  { titre: 'Désignation de l’objet', valeur: ({ lot }) => [designation(lot), lot.description].filter(Boolean).join(' — ') },
  { titre: 'Vendeur', valeur: ({ lot }) => lot.achat!.vendeur },
  { titre: 'Références de la vente', valeur: ({ lot }) => [lot.refVente && `vente ${lot.refVente}`, lot.numeroLot && `lot ${lot.numeroLot}`, lot.achat!.refPiece && `pièce ${lot.achat!.refPiece}`].filter(Boolean).join(', ') },
  { titre: 'Prix d’achat', valeur: ({ lot }) => lot.achat!.prixAdjuge + lot.achat!.fraisAcheteur, montant: true },
  { titre: 'Mode de règlement', valeur: ({ lot }) => lot.achat!.modePaiement },
];

/** CSV lisible par Excel en français : séparateur « ; », virgule décimale, BOM UTF-8. */
export function versCsv<T>(colonnes: Colonne<T>[], lignes: T[]): string {
  const echapper = (v: string | number) => {
    const s = typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corps = [colonnes.map((c) => echapper(c.titre)).join(';'), ...lignes.map((l) => colonnes.map((c) => echapper(c.valeur(l))).join(';'))];
  return '﻿' + corps.join('\r\n') + '\r\n';
}
