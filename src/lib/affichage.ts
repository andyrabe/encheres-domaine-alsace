import type { Statut } from '../types';

export function classeStatut(s: Statut): string {
  if (s === 'À étudier') return 's-etude';
  if (s === 'Inscrit à la vente' || s === 'Enchère placée') return 's-encours';
  if (s === 'Gagné' || s === 'Retiré' || s === 'En vente') return 's-stock';
  if (s === 'Vendu') return 's-vendu';
  return 's-fini';
}

/** Jours entre aujourd'hui et une date (AAAA-MM-JJ ou AAAA-MM-JJTHH:MM). */
export function joursAvant(iso: string, maintenant = new Date()): number {
  const d = new Date(iso.length === 10 ? iso + 'T12:00' : iso);
  const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const cible = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((cible.getTime() - debut.getTime()) / 86400000);
}

export function delaiLisible(iso: string): string {
  const j = joursAvant(iso);
  if (j === 0) return 'aujourd’hui';
  if (j === 1) return 'demain';
  if (j === -1) return 'hier';
  return j > 0 ? `dans ${j} jours` : `il y a ${-j} jours`;
}

export const dateHeure = (iso: string) =>
  new Date(iso.length === 10 ? iso + 'T12:00' : iso).toLocaleString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', ...(iso.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

export const dateLongue = (iso: string) =>
  new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
