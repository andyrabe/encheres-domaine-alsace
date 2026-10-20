// Modèle de données du carnet de revente.

export const STATUTS = [
  'À étudier',
  'Inscrit à la vente',
  'Enchère placée',
  'Gagné',
  'Retiré',
  'En vente',
  'Vendu',
  'Perdu',
  'Abandonné',
] as const;
export type Statut = (typeof STATUTS)[number];

/** Statuts où le lot nous appartient (stock). */
export const STATUTS_STOCK: Statut[] = ['Gagné', 'Retiré', 'En vente'];

export const CATEGORIES = [
  'Véhicule',
  'Deux-roues',
  'Outillage',
  'Informatique et téléphonie',
  'Électroménager',
  'Mobilier de bureau',
  'Matériel professionnel',
  'Montres et bijoux',
  'Vêtements et maroquinerie',
  'Divers',
] as const;
export type Categorie = (typeof CATEGORIES)[number];

export type ModeVente = 'encheres' | 'appel-offres';
export type ModePaiement = 'Virement' | 'Carte bancaire' | 'Chèque' | 'Espèces' | 'Paiement en ligne (plateforme)';
export const MODES_PAIEMENT: ModePaiement[] = ['Virement', 'Carte bancaire', 'Chèque', 'Espèces', 'Paiement en ligne (plateforme)'];

export interface Comparable {
  id: string;
  titre: string;
  prix: number;
  url: string;
  vendu: boolean; // prix de vente constaté plutôt que prix demandé
}

export interface EvenementJournal {
  id: string;
  date: string; // AAAA-MM-JJ
  texte: string;
}

export interface Achat {
  date: string; // date du paiement au Domaine
  prixAdjuge: number;
  fraisAcheteur: number; // frais de vente payés en sus
  refPiece: string; // numéro de bordereau ou de facture
  modePaiement: ModePaiement;
  vendeur: string; // ex. « État — Domaine (DNID), vente n° … »
}

export interface Vente {
  date: string; // date d'encaissement
  prix: number;
  plateforme: string;
  modePaiement: ModePaiement;
  acheteur: string;
  refPiece: string;
  fraisVente: number; // commission de la plateforme, envoi offert…
}

export interface Lot {
  id: string;
  titre: string;
  categorie: Categorie;
  statut: Statut;
  urlAnnonce: string;
  refVente: string;
  numeroLot: string;
  lieuRetrait: string;
  dateCloture?: string; // AAAA-MM-JJTHH:MM
  modeVente: ModeVente;
  prixActuel?: number; // mise à prix ou enchère en cours
  description: string; // état, marque, modèle, numéro de série…
  numeroSerie: string;
  notes: string;
  photos: string[];
  comparables: Comparable[];
  decotePct: number; // prudence appliquée aux prix des annonces
  prixReventeManuel?: number; // remplace l'estimation par les comparables
  transport: number;
  reparation: number;
  autresFrais: number; // carte grise, contrôle technique, pièces…
  fraisPlateformePct: number;
  fraisPlateformeFixe: number;
  margeMinEuros: number;
  margeMinPct: number; // en % du prix de revente
  achat?: Achat;
  vente?: Vente;
  journal: EvenementJournal[];
  creeLe: string;
  modifieLe: string;
}

export interface Profil {
  nom: string;
  adresse: string;
  siret: string;
  telephone: string;
  email: string;
  tauxCotisationsPct: number; // 12,3 % en 2026 pour la vente de marchandises
  tauxCfpPct: number; // contribution à la formation professionnelle
  versementLiberatoire: boolean; // impôt sur le revenu payé avec les cotisations
  tauxVersementLiberatoirePct: number;
  margeMinEurosDefaut: number;
  margeMinPctDefaut: number;
}
