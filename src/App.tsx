import { useMemo, useState } from 'react';
import type { Deplacement } from './types';
import { useDeplacements } from './hooks/useDeplacements';
import { exporterVersExcel } from './services/excelService';
import { Toolbar } from './components/Toolbar';
import { DeplacementForm } from './components/DeplacementForm';
import { DeplacementList } from './components/DeplacementList';
import { Synthese } from './components/Synthese';
import { Reglages } from './components/Reglages';
import './App.css';

function App() {
  const {
    deplacements,
    parametres,
    setParametres,
    ajouterDeplacement,
    modifierDeplacement,
    supprimerDeplacement,
    importerDeplacements,
  } = useDeplacements();

  const [deplacementEnEdition, setDeplacementEnEdition] = useState<Deplacement | null>(null);
  const [vueColonneGauche, setVueColonneGauche] = useState<'formulaire' | 'reglages'>('formulaire');

  const anneeCourante = new Date().getFullYear();
  const anneesDisponibles = useMemo(() => {
    const annees = new Set(deplacements.map(d => new Date(d.date).getFullYear()));
    annees.add(anneeCourante);
    return [...annees].sort((a, b) => b - a);
  }, [deplacements, anneeCourante]);

  const [filtreAnnee, setFiltreAnnee] = useState(anneeCourante);
  const [filtreMois, setFiltreMois] = useState(0);

  const handleSave = (data: Omit<Deplacement, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (deplacementEnEdition) {
      modifierDeplacement(deplacementEnEdition.id, data);
      setDeplacementEnEdition(null);
    } else {
      ajouterDeplacement(data);
    }
  };

  const handleEdit = (deplacement: Deplacement) => {
    setDeplacementEnEdition(deplacement);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setDeplacementEnEdition(null);
  };

  const handleDelete = (id: string) => {
    supprimerDeplacement(id);
    if (deplacementEnEdition?.id === id) {
      setDeplacementEnEdition(null);
    }
  };

  const handleExport = () => {
    exporterVersExcel(deplacements, parametres, filtreAnnee);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Frais kilométriques</h1>
        <p className="subtitle">Suivi des déplacements et indemnités kilométriques</p>
        <button
          type="button"
          className="btn-link btn-reglages"
          onClick={() => setVueColonneGauche(v => (v === 'reglages' ? 'formulaire' : 'reglages'))}
        >
          {vueColonneGauche === 'reglages' ? '← Retour au formulaire' : '⚙️ Réglages du barème'}
        </button>
      </header>

      <Toolbar
        deplacements={deplacements}
        parametres={parametres}
        filtreAnnee={filtreAnnee}
        onImport={importerDeplacements}
        onExport={handleExport}
      />

      <div className="filtres">
        <div className="form-group">
          <label htmlFor="filtreAnnee">Année</label>
          <select
            id="filtreAnnee"
            value={filtreAnnee}
            onChange={e => setFiltreAnnee(Number(e.target.value))}
          >
            {anneesDisponibles.map(annee => (
              <option key={annee} value={annee}>{annee}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="filtreMois">Mois</label>
          <select
            id="filtreMois"
            value={filtreMois}
            onChange={e => setFiltreMois(Number(e.target.value))}
          >
            <option value={0}>Tous les mois</option>
            {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((nom, i) => (
              <option key={nom} value={i + 1}>{nom}</option>
            ))}
          </select>
        </div>
      </div>

      <main className="app-main">
        <section className="colonne-form">
          {vueColonneGauche === 'reglages' ? (
            <Reglages
              parametres={parametres}
              onSave={setParametres}
              onClose={() => setVueColonneGauche('formulaire')}
            />
          ) : (
            <DeplacementForm
              deplacement={deplacementEnEdition}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </section>

        <section className="colonne-contenu">
          <Synthese
            deplacements={deplacements}
            parametres={parametres}
            annee={filtreAnnee}
          />

          <DeplacementList
            deplacements={deplacements}
            onEdit={handleEdit}
            onDelete={handleDelete}
            filtreAnnee={filtreAnnee}
            filtreMois={filtreMois}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
