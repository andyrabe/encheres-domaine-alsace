import type { ReactNode } from 'react';
import { IcAccueil, IcComptes, IcDomaine, IcLots, IcReglages } from './composants/Icones';
import { useRoute } from './contexte';
import { PageAccueil } from './pages/Accueil';
import { PageComptes } from './pages/Comptes';
import { PageDomaine } from './pages/Domaine';
import { PageLots } from './pages/Lots';
import { PageReglages } from './pages/Reglages';

const ONGLETS: { page: string; libelle: string; icone: ReactNode }[] = [
  { page: 'accueil', libelle: 'Accueil', icone: <IcAccueil /> },
  { page: 'lots', libelle: 'Mes lots', icone: <IcLots /> },
  { page: 'domaine', libelle: 'Ventes', icone: <IcDomaine /> },
  { page: 'comptes', libelle: 'Comptes', icone: <IcComptes /> },
  { page: 'reglages', libelle: 'Réglages', icone: <IcReglages /> },
];

export function App() {
  const route = useRoute();
  let contenu: ReactNode;
  switch (route.page) {
    case 'lots': contenu = <PageLots id={route.id} />; break;
    case 'domaine': contenu = <PageDomaine />; break;
    case 'comptes': contenu = <PageComptes />; break;
    case 'reglages': contenu = <PageReglages />; break;
    default: contenu = <PageAccueil />;
  }
  const actif = ONGLETS.some((o) => o.page === route.page) ? route.page : 'accueil';

  return (
    <>
      <header className="entete">
        <div className="entete-contenu">
          <a className="marque" href="#/accueil">
            <img src="./icone.svg" alt="" />
            <div>
              <strong>Carnet de revente</strong>
              <span>Lots du Domaine, achats et reventes</span>
            </div>
          </a>
          <nav className="onglets" aria-label="Sections">
            {ONGLETS.map((o) => (
              <a key={o.page} className="onglet" href={`#/${o.page}`} aria-current={actif === o.page ? 'page' : undefined}>
                {o.icone}
                <span>{o.libelle}</span>
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main>{contenu}</main>
    </>
  );
}
