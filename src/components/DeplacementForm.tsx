import { useState, useEffect } from 'react';
import type { Deplacement } from '../types';
import { validerDeplacement } from '../services/baremeService';

interface DeplacementFormProps {
  deplacement: Deplacement | null;
  onSave: (data: Omit<Deplacement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function DeplacementForm({ deplacement, onSave, onCancel }: DeplacementFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    motif: '',
    kmDepart: 0,
    kmArrivee: 0,
    peage: 0,
    carburant: 0,
    commentaire: '',
  });

  const [erreurs, setErreurs] = useState<string[]>([]);

  useEffect(() => {
    if (deplacement) {
      setFormData({
        date: deplacement.date,
        client: deplacement.client,
        motif: deplacement.motif,
        kmDepart: deplacement.kmDepart,
        kmArrivee: deplacement.kmArrivee,
        peage: deplacement.peage,
        carburant: deplacement.carburant,
        commentaire: deplacement.commentaire || '',
      });
    }
  }, [deplacement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const erreursValidation = validerDeplacement(formData);
    if (erreursValidation.length > 0) {
      setErreurs(erreursValidation);
      return;
    }

    onSave(formData);
    setErreurs([]);

    // Reset si nouveau (pas si édition)
    if (!deplacement) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        client: '',
        motif: '',
        kmDepart: formData.kmArrivee, // Pré-remplir avec le dernier km
        kmArrivee: 0,
        peage: 0,
        carburant: 0,
        commentaire: '',
      });
    }
  };

  const kmParcourus = formData.kmArrivee - formData.kmDepart;

  return (
    <form onSubmit={handleSubmit} className="deplacement-form">
      <h3>{deplacement ? 'Modifier le déplacement' : 'Nouveau déplacement'}</h3>

      {erreurs.length > 0 && (
        <div className="erreurs">
          {erreurs.map((err, i) => (
            <p key={i} className="erreur">{err}</p>
          ))}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="client">Client / Chantier *</label>
          <input
            type="text"
            id="client"
            name="client"
            value={formData.client}
            onChange={handleChange}
            placeholder="Nom du client ou chantier"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="motif">Motif *</label>
        <input
          type="text"
          id="motif"
          name="motif"
          value={formData.motif}
          onChange={handleChange}
          placeholder="Ex: Visite chantier, RDV client..."
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="kmDepart">Km départ *</label>
          <input
            type="number"
            id="kmDepart"
            name="kmDepart"
            value={formData.kmDepart || ''}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kmArrivee">Km arrivée *</label>
          <input
            type="number"
            id="kmArrivee"
            name="kmArrivee"
            value={formData.kmArrivee || ''}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>

        <div className="form-group km-parcourus">
          <label>Km parcourus</label>
          <span className={kmParcourus < 0 ? 'negatif' : ''}>
            {kmParcourus >= 0 ? kmParcourus : '—'}
          </span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="peage">Péage / Parking (€)</label>
          <input
            type="number"
            id="peage"
            name="peage"
            value={formData.peage || ''}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="carburant">Carburant (€)</label>
          <input
            type="number"
            id="carburant"
            name="carburant"
            value={formData.carburant || ''}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="commentaire">Commentaire</label>
        <textarea
          id="commentaire"
          name="commentaire"
          value={formData.commentaire}
          onChange={handleChange}
          rows={2}
          placeholder="Notes optionnelles..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {deplacement ? 'Enregistrer' : 'Ajouter'}
        </button>
        {deplacement && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
