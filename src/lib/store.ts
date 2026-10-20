// Stockage local dans le navigateur (IndexedDB) : vos lots, achats et ventes
// ne quittent jamais votre appareil. Export/import JSON pour sauvegarder
// ou passer du PC au téléphone.
import { get, set } from 'idb-keyval';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PROFIL_DEFAUT } from './calculs';
import type { Lot, Profil } from '../types';

export const CLES = {
  lots: 'lots',
  profil: 'profil',
  visitesSources: 'visitesSources',
  etapesDemarrage: 'etapesDemarrage',
} as const;

/** État persistant : se charge depuis IndexedDB puis s'y enregistre à chaque changement. */
export function usePersistant<T>(cle: string, defaut: T): [T, (v: T | ((prec: T) => T)) => void, boolean] {
  const [valeur, setValeur] = useState<T>(defaut);
  const [charge, setCharge] = useState(false);
  const pret = useRef(false);

  useEffect(() => {
    let actif = true;
    get<T>(cle)
      .then((v) => {
        if (actif && v !== undefined) setValeur(v);
      })
      .catch(() => {})
      .finally(() => {
        if (actif) {
          pret.current = true;
          setCharge(true);
        }
      });
    return () => {
      actif = false;
    };
  }, [cle]);

  const modifier = useCallback(
    (v: T | ((prec: T) => T)) => {
      setValeur((prec) => {
        const suivant = typeof v === 'function' ? (v as (p: T) => T)(prec) : v;
        if (pret.current) set(cle, suivant).catch((e) => console.error('Enregistrement impossible', e));
        return suivant;
      });
    },
    [cle],
  );

  return [valeur, modifier, charge];
}

export interface Sauvegarde {
  format: 'carnet-revente';
  version: 1;
  exporteLe: string;
  lots: Lot[];
  profil: Profil;
  visitesSources: Record<string, string>;
  etapesDemarrage: string[];
}

export async function exporterTout(): Promise<Sauvegarde> {
  return {
    format: 'carnet-revente',
    version: 1,
    exporteLe: new Date().toISOString(),
    lots: (await get<Lot[]>(CLES.lots)) ?? [],
    profil: (await get<Profil>(CLES.profil)) ?? PROFIL_DEFAUT,
    visitesSources: (await get<Record<string, string>>(CLES.visitesSources)) ?? {},
    etapesDemarrage: (await get<string[]>(CLES.etapesDemarrage)) ?? [],
  };
}

/** Importe une sauvegarde : les lots de même identifiant sont remplacés par la version la plus récente. */
export async function importerTout(donnees: unknown): Promise<{ lots: number }> {
  const s = donnees as Partial<Sauvegarde>;
  if (s?.format !== 'carnet-revente' || !Array.isArray(s.lots)) {
    throw new Error('Ce fichier n’est pas une sauvegarde du Carnet de revente.');
  }
  const actuels = (await get<Lot[]>(CLES.lots)) ?? [];
  const parId = new Map(actuels.map((l) => [l.id, l]));
  for (const l of s.lots) {
    const existant = parId.get(l.id);
    if (!existant || existant.modifieLe < l.modifieLe) parId.set(l.id, l);
  }
  await set(CLES.lots, [...parId.values()]);
  if (s.profil && !(await get<Profil>(CLES.profil))?.nom) await set(CLES.profil, s.profil);
  if (s.visitesSources) {
    const v = (await get<Record<string, string>>(CLES.visitesSources)) ?? {};
    await set(CLES.visitesSources, { ...s.visitesSources, ...v });
  }
  if (s.etapesDemarrage) {
    const e = new Set((await get<string[]>(CLES.etapesDemarrage)) ?? []);
    s.etapesDemarrage.forEach((x) => e.add(x));
    await set(CLES.etapesDemarrage, [...e]);
  }
  return { lots: s.lots.length };
}

export const nouvelId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function telechargerFichier(nom: string, contenu: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
