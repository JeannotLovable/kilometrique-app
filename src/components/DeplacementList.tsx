import type { Deplacement } from '../types';
import { enrichirDeplacement } from '../services/baremeService';
import { formaterEuros, formaterNombre } from '../services/excelService';
interface DeplacementListProps {
  deplacements: Deplacement[];
  onEdit: (deplacement: Deplacement) => void;
  onDelete: (id: string) => void;
  filtreAnnee: number;
  filtreMois: number;
}
export function DeplacementList({
  deplacements,
  onEdit,
  onDelete,
  filtreAnnee,
  filtreMois,
}: DeplacementListProps) {
  const deplacementsFiltres = deplacements
    .map(enrichirDeplacement)
    .filter(d => d.annee === filtreAnnee)
    .filter(d => filtreMois === 0 || d.mois === filtreMois)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (deplacementsFiltres.length === 0) {
    return (
      <div className="deplacement-list vide">
        <p>Aucun déplacement enregistré pour cette période.</p>
      </div>
    );
  }
  const totalKm = deplacementsFiltres.reduce((sum, d) => sum + d.kmParcourus, 0);
  const totalFrais = deplacementsFiltres.reduce((sum, d) => sum + d.totalFrais, 0);
  return (
    <div className="deplacement-list">
      <div className="list-header">
        <h3>Déplacements ({deplacementsFiltres.length})</h3>
        <div className="list-totaux">
          <span>Total: {formaterNombre(totalKm)} km</span>
          <span>Frais: {formaterEuros(totalFrais)}</span>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client / Motif</th>
              <th>Km</th>
              <th>Frais</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deplacementsFiltres.map(d => (
              <tr key={d.id}>
                <td>{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                <td>
                  <strong>{d.client}</strong>
                  <br />
                  <small>{d.motif}</small>
                </td>
                <td className="nombre">{formaterNombre(d.kmParcourus)}</td>
                <td className="nombre">{formaterEuros(d.totalFrais)}</td>
                <td className="actions">
                  <button
                    onClick={() => onEdit(d)}
                    className="btn-icon"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce déplacement ?')) {
                        onDelete(d.id);
                      }
                    }}
                    className="btn-icon btn-danger"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
