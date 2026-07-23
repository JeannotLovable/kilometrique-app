import { useEffect, useState } from 'react';
import type { Parametres } from '../types';

interface ReglagesProps {
  parametres: Parametres;
  onSave: (parametres: Parametres) => void;
  onClose: () => void;
}

interface FormBareme {
  annee: number;
  seuil1: number;
  seuil2: number;
  taux1: number;
  taux2: number;
  forfait2: number;
  taux3: number;
}

export function Reglages({ parametres, onSave, onClose }: ReglagesProps) {
  const [anneeFiscale, setAnneeFiscale] = useState(parametres.anneeFiscale);
  const [bareme, setBareme] = useState<FormBareme>(parametres.bareme);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    setAnneeFiscale(parametres.anneeFiscale);
    setBareme(parametres.bareme);
  }, [parametres]);

  const handleChangeBareme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBareme(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const valider = (): string[] => {
    const erreursValidation: string[] = [];

    if (!bareme.annee || bareme.annee < 2000) {
      erreursValidation.push("L'année du barème est invalide");
    }
    if (bareme.seuil1 <= 0) {
      erreursValidation.push('Le seuil 1 doit être supérieur à 0');
    }
    if (bareme.seuil2 <= bareme.seuil1) {
      erreursValidation.push('Le seuil 2 doit être supérieur au seuil 1');
    }
    if (bareme.taux1 <= 0 || bareme.taux2 <= 0 || bareme.taux3 <= 0) {
      erreursValidation.push('Les taux doivent être supérieurs à 0');
    }
    if (bareme.forfait2 < 0) {
      erreursValidation.push('Le forfait ne peut pas être négatif');
    }

    return erreursValidation;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const erreursValidation = valider();
    if (erreursValidation.length > 0) {
      setErreurs(erreursValidation);
      setConfirmation(false);
      return;
    }

    onSave({ anneeFiscale, bareme });
    setErreurs([]);
    setConfirmation(true);
  };

  return (
    <form onSubmit={handleSubmit} className="deplacement-form reglages-form">
      <h3>Réglages</h3>

      {erreurs.length > 0 && (
        <div className="erreurs">
          {erreurs.map((err, i) => (
            <p key={i} className="erreur">{err}</p>
          ))}
        </div>
      )}

      {confirmation && erreurs.length === 0 && (
        <div className="message success">Paramètres enregistrés</div>
      )}

      <div className="form-group">
        <label htmlFor="anneeFiscale">Année fiscale</label>
        <input
          type="number"
          id="anneeFiscale"
          value={anneeFiscale || ''}
          onChange={e => setAnneeFiscale(parseInt(e.target.value, 10) || anneeFiscale)}
          min="2000"
          step="1"
        />
      </div>

      <fieldset className="bareme-fieldset">
        <legend>Barème kilométrique</legend>

        <div className="form-group">
          <label htmlFor="bareme-annee">Année du barème</label>
          <input
            type="number"
            id="bareme-annee"
            name="annee"
            value={bareme.annee || ''}
            onChange={handleChangeBareme}
            min="2000"
            step="1"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="seuil1">Seuil 1 (km)</label>
            <input
              type="number"
              id="seuil1"
              name="seuil1"
              value={bareme.seuil1 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taux1">Taux ≤ seuil 1 (€/km)</label>
            <input
              type="number"
              id="taux1"
              name="taux1"
              value={bareme.taux1 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="0.001"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="seuil2">Seuil 2 (km)</label>
            <input
              type="number"
              id="seuil2"
              name="seuil2"
              value={bareme.seuil2 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taux2">Taux entre seuils (€/km)</label>
            <input
              type="number"
              id="taux2"
              name="taux2"
              value={bareme.taux2 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="0.001"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="forfait2">Forfait tranche 2 (€)</label>
            <input
              type="number"
              id="forfait2"
              name="forfait2"
              value={bareme.forfait2 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taux3">Taux &gt; seuil 2 (€/km)</label>
            <input
              type="number"
              id="taux3"
              name="taux3"
              value={bareme.taux3 || ''}
              onChange={handleChangeBareme}
              min="0"
              step="0.001"
            />
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn-primary">Enregistrer</button>
        <button type="button" onClick={onClose} className="btn-secondary">Fermer</button>
      </div>
    </form>
  );
}
