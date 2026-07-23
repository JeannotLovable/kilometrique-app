import { useState, useEffect, useCallback } from 'react';
import type { Deplacement, Parametres } from '../types';
import { BAREME_2026 } from '../services/baremeService';

const STORAGE_KEY_DEPLACEMENTS = 'kilometrique_deplacements';
const STORAGE_KEY_PARAMETRES = 'kilometrique_parametres';

const PARAMETRES_DEFAUT: Parametres = {
  anneeFiscale: new Date().getFullYear(),
  bareme: BAREME_2026,
};

function genererId(): string {
  return crypto.randomUUID();
}

function chargerDeplacements(): Deplacement[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DEPLACEMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function chargerParametres(): Parametres {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PARAMETRES);
    return data ? { ...PARAMETRES_DEFAUT, ...JSON.parse(data) } : PARAMETRES_DEFAUT;
  } catch {
    return PARAMETRES_DEFAUT;
  }
}

export function useDeplacements() {
  const [deplacements, setDeplacements] = useState<Deplacement[]>(chargerDeplacements);
  const [parametres, setParametres] = useState<Parametres>(chargerParametres);
  const [deplacementEnCours, setDeplacementEnCours] = useState<Deplacement | null>(null);

  // Persistance automatique
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEPLACEMENTS, JSON.stringify(deplacements));
  }, [deplacements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PARAMETRES, JSON.stringify(parametres));
  }, [parametres]);

  const ajouterDeplacement = useCallback((data: Omit<Deplacement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const nouveau: Deplacement = {
      ...data,
      id: genererId(),
      createdAt: now,
      updatedAt: now,
    };
    setDeplacements(prev => [...prev, nouveau]);
    return nouveau;
  }, []);

  const modifierDeplacement = useCallback((id: string, data: Partial<Deplacement>) => {
    setDeplacements(prev =>
      prev.map(d =>
        d.id === id
          ? { ...d, ...data, updatedAt: new Date().toISOString() }
          : d
      )
    );
  }, []);

  const supprimerDeplacement = useCallback((id: string) => {
    setDeplacements(prev => prev.filter(d => d.id !== id));
  }, []);

  const importerDeplacements = useCallback((nouveaux: Deplacement[]) => {
    setDeplacements(prev => {
      // Éviter les doublons par id
      const existants = new Set(prev.map(d => d.id));
      const aAjouter = nouveaux.filter(d => !existants.has(d.id));
      return [...prev, ...aAjouter];
    });
  }, []);

  const toutEffacer = useCallback(() => {
    setDeplacements([]);
  }, []);

  return {
    deplacements,
    parametres,
    deplacementEnCours,
    setDeplacementEnCours,
    setParametres,
    ajouterDeplacement,
    modifierDeplacement,
    supprimerDeplacement,
    importerDeplacements,
    toutEffacer,
  };
}
