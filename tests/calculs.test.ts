import { describe, expect, it } from 'vitest';
import {
  alertesSeuils, bilanAnnee, chiffrer, estimationRevente, mediane, PROFIL_DEFAUT, resultatReel, tauxPrelevementsPct,
} from '../src/lib/calculs';
import { COLONNES_ACHATS, COLONNES_OBJETS, lignesAchats, lignesObjets, versCsv } from '../src/lib/registres';
import type { Lot } from '../src/types';

const lotBase = (partiel: Partial<Lot> = {}): Lot => ({
  id: 'l1', titre: 'Perceuse sans fil', categorie: 'Outillage', statut: 'À étudier', urlAnnonce: '', refVente: '', numeroLot: '',
  lieuRetrait: '', modeVente: 'encheres', description: '', numeroSerie: '', notes: '', photos: [], comparables: [],
  decotePct: 15, transport: 0, reparation: 0, autresFrais: 0, fraisPlateformePct: 0, fraisPlateformeFixe: 0,
  margeMinEuros: 40, margeMinPct: 25, journal: [], creeLe: '2026-10-01T00:00:00Z', modifieLe: '2026-10-01T00:00:00Z',
  ...partiel,
});

describe('estimation du prix de revente', () => {
  it('calcule une médiane', () => {
    expect(mediane([100, 300, 200])).toBe(200);
    expect(mediane([100, 200])).toBe(150);
    expect(mediane([])).toBeUndefined();
  });
  it('décote les prix demandés mais pas les ventes constatées', () => {
    const c = [
      { id: 'a', titre: '', url: '', prix: 200, vendu: false },
      { id: 'b', titre: '', url: '', prix: 160, vendu: true },
      { id: 'c', titre: '', url: '', prix: 220, vendu: false },
    ];
    // 200 → 170, 160 → 160, 220 → 187 : médiane 170
    expect(estimationRevente(c, 15)).toBe(170);
  });
});

describe('enchère maximale', () => {
  it('garantit la marge visée en comptant les 11 % de frais acheteur', () => {
    const lot = lotBase({ prixReventeManuel: 200, transport: 10 });
    const c = chiffrer(lot, PROFIL_DEFAUT);
    // recette nette = 200 - 12,4 % ; marge visée = max(40, 25 % × 200 = 50) = 50
    const recette = 200 * (1 - tauxPrelevementsPct(PROFIL_DEFAUT) / 100);
    expect(c.recetteNette).toBeCloseTo(recette, 6);
    expect(c.enchereMax).toBe(Math.floor((recette - 10 - 50) / 1.11));
    // À l'enchère max, la marge réelle reste au moins égale à la marge visée.
    const aEnchereMax = chiffrer({ ...lot, prixActuel: c.enchereMax }, PROFIL_DEFAUT);
    expect(aEnchereMax.margeReference!).toBeGreaterThanOrEqual(50);
  });
  it('utilise 6 % de frais pour un appel d’offres', () => {
    const c = chiffrer(lotBase({ prixReventeManuel: 200, modeVente: 'appel-offres' }), PROFIL_DEFAUT);
    expect(c.fraisAcheteurPct).toBe(6);
  });
  it('ne propose rien sans prix de revente', () => {
    expect(chiffrer(lotBase(), PROFIL_DEFAUT).enchereMax).toBe(0);
  });
  it('compte le versement libératoire s’il est choisi', () => {
    expect(tauxPrelevementsPct({ ...PROFIL_DEFAUT, versementLiberatoire: true })).toBeCloseTo(13.4, 6);
  });
});

describe('bilan et registres', () => {
  const vendu = lotBase({
    id: 'v', statut: 'Vendu', transport: 15,
    achat: { date: '2026-03-02', prixAdjuge: 100, fraisAcheteur: 11, refPiece: 'B-12', modePaiement: 'Virement', vendeur: 'État — Domaine' },
    vente: { date: '2026-04-10', prix: 250, plateforme: 'Leboncoin', modePaiement: 'Paiement en ligne (plateforme)', acheteur: '', refPiece: 'V-1', fraisVente: 0 },
  });
  const stock = lotBase({
    id: 's', statut: 'En vente', creeLe: '2026-05-01T00:00:00Z',
    achat: { date: '2026-05-03', prixAdjuge: 50, fraisAcheteur: 5.5, refPiece: 'B-20', modePaiement: 'Carte bancaire', vendeur: 'État — Domaine' },
  });

  it('calcule le résultat réel d’un lot vendu', () => {
    const r = resultatReel(vendu, PROFIL_DEFAUT)!;
    expect(r.cout).toBe(126);
    expect(r.marge).toBeCloseTo(250 - 250 * 0.124 - 126, 6);
  });

  it('fait le bilan de l’année', () => {
    const b = bilanAnnee([vendu, stock], PROFIL_DEFAUT, 2026);
    expect(b.chiffreAffaires).toBe(250);
    expect(b.parTrimestre).toEqual([0, 250, 0, 0]);
    expect(b.stockNombre).toBe(1);
    expect(b.stockValeur).toBe(55.5);
  });

  it('numérote le registre des objets dans l’ordre des acquisitions', () => {
    expect(lignesObjets([stock, vendu]).map((l) => [l.lot.id, l.numeroOrdre])).toEqual([['v', 1], ['s', 2]]);
  });

  it('exporte un CSV lisible par Excel', () => {
    const csv = versCsv(COLONNES_ACHATS, lignesAchats([vendu]));
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('111,00');
    expect(csv).toContain('02/03/2026');
    expect(versCsv(COLONNES_OBJETS, lignesObjets([vendu]))).toContain('Perceuse sans fil (outillage)');
  });

  it('prévient à l’approche des seuils de TVA', () => {
    expect(alertesSeuils(10000)).toHaveLength(0);
    expect(alertesSeuils(70000)[0].niveau).toBe('info');
    expect(alertesSeuils(90000)[0].niveau).toBe('attention');
    expect(alertesSeuils(95000)[0].niveau).toBe('bloquant');
  });
});
