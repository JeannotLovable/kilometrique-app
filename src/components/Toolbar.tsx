import { useRef, useState } from 'react';
import type { Parametres } from '../types';
import { exporterVersExcel, importerDepuisExcel, telechargerModele } from '../services/excelService';
import type { Deplacement } from '../types';

interface ToolbarProps {
  deplacements: Deplacement[];
  parametres: Parametres;
  filtreAnnee: number;
  onImport: (deplacements: Deplacement[]) => void;
  onExport: () => void;
}

export function Toolbar({
  deplacements,
  parametres,
  filtreAnnee,
  onImport,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importEnCours, setImportEnCours] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportEnCours(true);
    setMessage(null);

    const result = await importerDepuisExcel(file);

    if (result.success) {
      onImport(result.data);
      setMessage({ type: 'success', text: `${result.data.length} déplacement(s) importé(s)` });
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setImportEnCours(false);
    // Reset input pour permettre de réimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    if (deplacements.length === 0) {
      setMessage({ type: 'error', text: 'Aucun déplacement à exporter' });
      return;
    }
    exporterVersExcel(deplacements, parametres, filtreAnnee);
    setMessage({ type: 'success', text: 'Export Excel téléchargé' });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-actions">
        <button onClick={handleImportClick} disabled={importEnCours} className="btn-secondary">
          {importEnCours ? 'Import...' : '📥 Importer Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button onClick={handleExport} className="btn-secondary">
          📤 Exporter Excel
        </button>

        <button onClick={telechargerModele} className="btn-link">
          Télécharger le modèle
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="btn-close">×</button>
        </div>
      )}
    </div>
  );
}
