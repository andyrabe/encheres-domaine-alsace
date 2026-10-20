import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { PROFIL_DEFAUT } from './lib/calculs';
import { CLES, aujourdhui, nouvelId, usePersistant } from './lib/store';
import type { Lot, Profil } from './types';

// ---------- navigation par ancre (#/lots/123?x=y) ----------
export interface Route {
  page: string;
  id?: string;
  params: URLSearchParams;
}

function lireRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [chemin, requete] = h.split('?');
  const [page, id] = chemin.split('/');
  return { page: page || 'accueil', id: id ? decodeURIComponent(id) : undefined, params: new URLSearchParams(requete ?? '') };
}

export function aller(chemin: string) {
  window.location.hash = '#/' + chemin.replace(/^#?\/?/, '');
}

export function useRoute(): Route {
  const [route, setRoute] = useState(lireRoute);
  useEffect(() => {
    const surChangement = () => {
      setRoute(lireRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);
  return route;
}

// ---------- données ----------
interface Contexte {
  charge: boolean;
  lots: Lot[];
  enregistrerLot: (l: Lot) => void;
  supprimerLot: (id: string) => void;
  creerLot: (partiel?: Partial<Lot>) => Lot;
  profil: Profil;
  setProfil: (p: Profil) => void;
  visitesSources: Record<string, string>;
  noterVisiteSource: (url: string) => void;
  etapesDemarrage: string[];
  basculerEtape: (id: string) => void;
  notifier: (message: string) => void;
}

const Ctx = createContext<Contexte | null>(null);

export function lotVide(profil: Profil, partiel: Partial<Lot> = {}): Lot {
  const maintenant = new Date().toISOString();
  return {
    id: nouvelId(),
    titre: '',
    categorie: 'Divers',
    statut: 'À étudier',
    urlAnnonce: '',
    refVente: '',
    numeroLot: '',
    lieuRetrait: '',
    modeVente: 'encheres',
    description: '',
    numeroSerie: '',
    notes: '',
    photos: [],
    comparables: [],
    decotePct: 15,
    transport: 0,
    reparation: 0,
    autresFrais: 0,
    fraisPlateformePct: 0,
    fraisPlateformeFixe: 0,
    margeMinEuros: profil.margeMinEurosDefaut,
    margeMinPct: profil.margeMinPctDefaut,
    journal: [{ id: nouvelId(), date: aujourdhui(), texte: 'Lot ajouté' }],
    creeLe: maintenant,
    modifieLe: maintenant,
    ...partiel,
  };
}

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [lots, setLots, charge] = usePersistant<Lot[]>(CLES.lots, []);
  const [profilStocke, setProfil] = usePersistant<Profil>(CLES.profil, PROFIL_DEFAUT);
  const [visitesSources, setVisites] = usePersistant<Record<string, string>>(CLES.visitesSources, {});
  const [etapesDemarrage, setEtapes] = usePersistant<string[]>(CLES.etapesDemarrage, []);
  const [toast, setToast] = useState<string>();
  // Un profil enregistré par une version précédente reçoit les nouveaux champs par défaut.
  const profil = { ...PROFIL_DEFAUT, ...profilStocke };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const enregistrerLot = useCallback(
    (l: Lot) => {
      const maj = { ...l, modifieLe: new Date().toISOString() };
      setLots((liste) => (liste.some((x) => x.id === l.id) ? liste.map((x) => (x.id === l.id ? maj : x)) : [maj, ...liste]));
    },
    [setLots],
  );

  const valeur: Contexte = {
    charge,
    lots,
    enregistrerLot,
    supprimerLot: (id) => setLots((l) => l.filter((x) => x.id !== id)),
    creerLot: (partiel) => {
      const l = lotVide(profil, partiel);
      setLots((liste) => [l, ...liste]);
      return l;
    },
    profil,
    setProfil,
    visitesSources,
    noterVisiteSource: (url) => setVisites((v) => ({ ...v, [url]: new Date().toISOString() })),
    etapesDemarrage,
    basculerEtape: (id) => setEtapes((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id])),
    notifier: setToast,
  };

  return (
    <Ctx.Provider value={valeur}>
      {children}
      {toast && <div className="toast" role="status">{toast}</div>}
    </Ctx.Provider>
  );
}

export function useDonnees(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDonnees hors du FournisseurDonnees');
  return c;
}
