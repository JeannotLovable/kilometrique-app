import type { Deplacement, Parametres } from '../types';
import { genererSyntheseAnnuelle } from '../services/baremeService';
import { formaterEuros, formaterNombre } from '../services/excelService';

interface SyntheseProps {
  deplacements: Deplacement[];
  parametres: Parametres;
  annee: number;
}

export function Synthese({ deplacements, parametres, annee }: SyntheseProps) {
  const synthese = genererSyntheseAnnuelle(deplacements, annee, parametres.bareme);

  return (
    <div className="synthese">
      <h3>Synthèse {annee}</h3>

      <div className="synthese-cards">
        <div className="card">
          <span className="card-label">Total kilomètres</span>
          <span className="card-value">{formaterNombre(synthese.totalKm)} km</span>
        </div>

        <div className="card">
          <span className="card-label">Frais (péage + carburant)</span>
          <span className="card-value">{formaterEuros(synthese.totalFrais)}</span>
        </div>

        <div className="card highlight">
          <span className="card-label">Indemnité kilométrique</span>
          <span className="card-value">{formaterEuros(synthese.indemniteAnnuelle)}</span>
        </div>

        <div className="card total">
          <span className="card-label">Total général</span>
          <span className="card-value">{formaterEuros(synthese.totalGeneral)}</span>
        </div>
      </div>

      <details className="detail-mensuel">
        <summary>Détail par mois</summary>
        <table>
          <thead>
            <tr>
              <th>Mois</th>
              <th>Km</th>
              <th>Frais</th>
              <th>Indemnité cumulée</th>
            </tr>
          </thead>
          <tbody>
            {synthese.mois.map(m => (
              <tr key={m.mois} className={m.kmParcourus > 0 ? '' : 'vide'}>
                <td>{m.nomMois}</td>
                <td className="nombre">{m.kmParcourus > 0 ? formaterNombre(m.kmParcourus) : '—'}</td>
                <td className="nombre">{m.totalFrais > 0 ? formaterEuros(m.totalFrais) : '—'}</td>
                <td className="nombre">{m.indemnite > 0 ? formaterEuros(m.indemnite) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="bareme-info">
        <small>
          Barème {parametres.bareme.annee} :
          ≤ {formaterNombre(parametres.bareme.seuil1)} km → {parametres.bareme.taux1} €/km |
          ≤ {formaterNombre(parametres.bareme.seuil2)} km → {parametres.bareme.taux2} €/km + {formaterNombre(parametres.bareme.forfait2)} € |
          &gt; {formaterNombre(parametres.bareme.seuil2)} km → {parametres.bareme.taux3} €/km
        </small>
      </div>
    </div>
  );
}
