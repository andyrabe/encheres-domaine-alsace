// Contenu de référence : démarrage de l'activité, sources, vérifications.

export interface Etape {
  id: string;
  titre: string;
  detail: string;
  lien?: { libelle: string; url: string };
}

/** Démarches pour revendre régulièrement en restant dans les règles. */
export const ETAPES_DEMARRAGE: Etape[] = [
  {
    id: 'micro',
    titre: 'Déclarer une micro-entreprise de vente de marchandises',
    detail: 'Gratuit, en ligne. Choisissez une activité d’achat-revente (commerce de détail d’occasion). Vous obtenez un numéro SIRET.',
    lien: { libelle: 'Guichet unique des formalités', url: 'https://formalites.entreprises.gouv.fr/' },
  },
  {
    id: 'prefecture',
    titre: 'Déclarer l’activité de revendeur d’objets d’occasion en préfecture',
    detail: 'Obligatoire avant de commencer, avec le formulaire Cerfa 11733*02, à la préfecture ou sous-préfecture de votre domicile. Gardez le récépissé : il peut vous être demandé.',
    lien: { libelle: 'Fiche officielle sur la vente de biens d’occasion', url: 'https://www.entreprises.gouv.fr/la-dge/publications/demarrer-la-vente-de-biens-doccasion-tout-savoir-sur-la-declaration-pour' },
  },
  {
    id: 'registres',
    titre: 'Tenir les registres',
    detail: 'Livre des recettes et registre des achats (micro-entreprise), et registre des objets mobiliers (revente d’occasion). L’onglet Comptes les prépare à partir de vos lots.',
  },
  {
    id: 'compte-domaine',
    titre: 'Créer votre compte sur le site des enchères du Domaine',
    detail: 'Faites valider vos justificatifs à l’avance : pour chaque vente, il faut s’inscrire et verser une caution. Certains lots sont réservés aux professionnels (extrait Kbis de moins de trois mois).',
    lien: { libelle: 'Enchères du Domaine', url: 'https://encheres-domaine.gouv.fr/' },
  },
  {
    id: 'compte-pro',
    titre: 'Vendre avec un compte professionnel',
    detail: 'Sur Leboncoin et les autres plateformes, un vendeur professionnel doit se déclarer comme tel. Vos acheteurs bénéficient alors des garanties légales du consommateur.',
  },
  {
    id: 'banque',
    titre: 'Ouvrir un compte bancaire dédié',
    detail: 'Obligatoire dès que le chiffre d’affaires dépasse 10 000 € deux années de suite, et bien plus simple pour suivre vos comptes dès le début.',
  },
];

export interface Source {
  nom: string;
  url: string;
  description: string;
}

export const SOURCES: Source[] = [
  {
    nom: 'Enchères du Domaine',
    url: 'https://encheres-domaine.gouv.fr/',
    description: 'Le site officiel des ventes de l’État : véhicules, matériel, objets saisis. Le site ne permet pas la lecture automatique : consultez-le vous-même, idéalement deux fois par semaine.',
  },
  {
    nom: 'Drouot (ventes en ligne)',
    url: 'https://www.drouot.com/',
    description: 'Une partie des ventes du Domaine y est retransmise ou se déroule entièrement en ligne.',
  },
  {
    nom: 'Moniteur Live',
    url: 'https://www.moniteurlive.com/',
    description: 'Autre plateforme de retransmission des ventes du Domaine, avec enchères en direct.',
  },
  {
    nom: 'Leboncoin',
    url: 'https://www.leboncoin.fr/',
    description: 'Pour relever les prix des annonces comparables avant d’enchérir, et pour revendre.',
  },
];

/** Vérifications avant d'enchérir sur un véhicule. */
export const VERIFICATIONS_VEHICULE: string[] = [
  'Lire l’annonce : « roulant », « non roulant », « pour pièces » ou « épave » changent tout.',
  'Vérifier que les documents sont fournis (certificat d’immatriculation, procès-verbal de contrôle technique).',
  'Consulter l’historique du véhicule sur HistoVec avec le vendeur ou les documents fournis.',
  'Compter le coût de la carte grise (taxe régionale par cheval fiscal) dans « autres frais ».',
  'Prévoir un contrôle technique de moins de six mois pour revendre à un particulier.',
  'Prévoir le transport : un véhicule non roulant se déplace sur un plateau.',
  'Respecter le délai d’enlèvement indiqué dans les conditions de la vente.',
];

/** Vérifications générales avant d'enchérir. */
export const VERIFICATIONS_LOT: string[] = [
  'Aller à l’exposition des lots, ou demander des photos supplémentaires si possible.',
  'Relever au moins trois annonces comparables, de préférence des ventes conclues.',
  'Vérifier le lieu et le délai de retrait : un lot lointain coûte en carburant et en temps.',
  'Lire les conditions de vente : caution, délai de paiement, frais acheteur.',
  'Fixer son enchère maximale avant la vente et ne pas la dépasser.',
];
