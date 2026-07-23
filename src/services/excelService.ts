import * as XLSX from 'xlsx';
import type { Deplacement, LigneExcelReleve, LigneExcelSynthese, Parametres, Result } from '../types';
import { enrichirDeplacement, genererSyntheseAnnuelle, MOIS_FR } from './baremeService';

/**
 * Service d'import/export Excel
 * Compatible avec le format releve_kilometrique.xlsx
 */

// ============================================
// EXPORT
// ============================================

/**
 * Exporte les déplacements vers un fichier Excel
 * @param deplacements Liste des déplacements
 * @param parametres Paramètres avec barème
 * @param annee Année à exporter (optionnel, tous si non spécifié)
 */
export function exporterVersExcel(
  deplacements: Deplacement[],
  parametres: Parametres,
  annee?: number
): void {
  const workbook = XLSX.utils.book_new();

  // Filtrer par année si spécifié
  const deplacementsFiltres = annee
    ? deplacements.filter(d => new Date(d.date).getFullYear() === annee)
    : deplacements;

  // Feuille 1 : Relevé détaillé
  const lignesReleve: LigneExcelReleve[] = deplacementsFiltres
    .map(enrichirDeplacement)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      Date: d.date,
      'Client / chantier': d.client,
      Motif: d.motif,
      'Km départ': d.kmDepart,
      'Km arrivée': d.kmArrivee,
      'Km parcourus': d.kmParcourus,
      'Péage / parking': d.peage,
      Carburant: d.carburant,
      'Total frais': d.totalFrais,
      Commentaire: d.commentaire || '',
      Année: d.annee,
      Mois: d.mois,
    }));

  const wsReleve = XLSX.utils.json_to_sheet(lignesReleve);
  XLSX.utils.book_append_sheet(workbook, wsReleve, 'Relevé');

  // Feuille 2 : Synthèse par année
  const annees = [...new Set(deplacementsFiltres.map(d => new Date(d.date).getFullYear()))].sort();

  for (const an of annees) {
    const synthese = genererSyntheseAnnuelle(deplacements, an, parametres.bareme);

    // Lignes mensuelles
    const lignesMensuelles: LigneExcelSynthese[] = synthese.mois.map(m => ({
      'N° mois': m.mois,
      Mois: m.nomMois,
      'Km parcourus': m.kmParcourus,
      'Frais (péage/parking + carburant)': m.totalFrais,
    }));

    // Ajouter le total annuel
    const lignesAvecTotal = [
      ...lignesMensuelles,
      {
        'N° mois': 0,
        Mois: 'TOTAL ANNÉE',
        'Km parcourus': synthese.totalKm,
        'Frais (péage/parking + carburant)': synthese.totalFrais,
      },
      {
        'N° mois': 0,
        Mois: 'Indemnité kilométrique',
        'Km parcourus': 0,
        'Frais (péage/parking + carburant)': synthese.indemniteAnnuelle,
      },
      {
        'N° mois': 0,
        Mois: 'TOTAL GÉNÉRAL',
        'Km parcourus': 0,
        'Frais (péage/parking + carburant)': synthese.totalGeneral,
      },
    ];

    const wsSynthese = XLSX.utils.json_to_sheet(lignesAvecTotal);
    XLSX.utils.book_append_sheet(workbook, wsSynthese, `Synthèse ${an}`);
  }

  // Feuille 3 : Paramètres
  const lignesParametres = [
    { Paramètre: 'Année fiscale', Valeur: parametres.anneeFiscale },
    { Paramètre: 'Barème année', Valeur: parametres.bareme.annee },
    { Paramètre: 'Seuil 1 (km)', Valeur: parametres.bareme.seuil1 },
    { Paramètre: 'Seuil 2 (km)', Valeur: parametres.bareme.seuil2 },
    { Paramètre: 'Taux 1 (€/km)', Valeur: parametres.bareme.taux1 },
    { Paramètre: 'Taux 2 (€/km)', Valeur: parametres.bareme.taux2 },
    { Paramètre: 'Forfait 2 (€)', Valeur: parametres.bareme.forfait2 },
    { Paramètre: 'Taux 3 (€/km)', Valeur: parametres.bareme.taux3 },
  ];

  const wsParametres = XLSX.utils.json_to_sheet(lignesParametres);
  XLSX.utils.book_append_sheet(workbook, wsParametres, 'Paramètres');

  // Générer le nom de fichier
  const dateStr = new Date().toISOString().split('T')[0];
  const nomFichier = annee
    ? `releve_kilometrique_${annee}_${dateStr}.xlsx`
    : `releve_kilometrique_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, nomFichier);
}

// ============================================
// IMPORT
// ============================================

/**
 * Importe des déplacements depuis un fichier Excel
 * @param file Fichier Excel à importer
 * @returns Résultat avec les déplacements importés ou erreur
 */
export async function importerDepuisExcel(file: File): Promise<Result<Deplacement[]>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Chercher la feuille "Relevé" ou la première feuille
    const nomFeuille = workbook.SheetNames.find(n => n.toLowerCase().includes('relevé'))
      || workbook.SheetNames[0];

    if (!nomFeuille) {
      return { success: false, error: 'Aucune feuille trouvée dans le fichier' };
    }

    const worksheet = workbook.Sheets[nomFeuille];
    const lignes: LigneExcelReleve[] = XLSX.utils.sheet_to_json(worksheet);

    if (lignes.length === 0) {
      return { success: false, error: 'Aucune donnée trouvée dans la feuille' };
    }

    const deplacements: Deplacement[] = [];
    const erreurs: string[] = [];

    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const ligneNum = i + 2; // +2 car index 0 + en-tête

      try {
        // Validation des champs obligatoires
        if (!ligne.Date) {
          erreurs.push(`Ligne ${ligneNum}: Date manquante`);
          continue;
        }

        // Parser la date (peut être string ou nombre Excel)
        let date: Date;
        if (typeof ligne.Date === 'number') {
          // Date Excel (nombre de jours depuis 1900)
          date = new Date((ligne.Date - 25569) * 86400 * 1000);
        } else {
          date = new Date(ligne.Date);
        }

        if (isNaN(date.getTime())) {
          erreurs.push(`Ligne ${ligneNum}: Date invalide "${ligne.Date}"`);
          continue;
        }

        const deplacement: Deplacement = {
          id: crypto.randomUUID(),
          date: date.toISOString().split('T')[0],
          client: String(ligne['Client / chantier'] || ''),
          motif: String(ligne.Motif || ''),
          kmDepart: Number(ligne['Km départ']) || 0,
          kmArrivee: Number(ligne['Km arrivée']) || 0,
          peage: Number(ligne['Péage / parking']) || 0,
          carburant: Number(ligne.Carburant) || 0,
          commentaire: ligne.Commentaire ? String(ligne.Commentaire) : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Validation km
        if (deplacement.kmArrivee < deplacement.kmDepart) {
          erreurs.push(`Ligne ${ligneNum}: Km arrivée < Km départ`);
          continue;
        }

        deplacements.push(deplacement);
      } catch (e) {
        erreurs.push(`Ligne ${ligneNum}: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
      }
    }

    if (deplacements.length === 0 && erreurs.length > 0) {
      return { success: false, error: `Aucun déplacement valide. Erreurs: ${erreurs.slice(0, 5).join('; ')}` };
    }

    if (erreurs.length > 0) {
      console.warn('Import partiel avec erreurs:', erreurs);
    }

    return { success: true, data: deplacements };
  } catch (e) {
    return {
      success: false,
      error: `Erreur lors de la lecture du fichier: ${e instanceof Error ? e.message : 'Erreur inconnue'}`
    };
  }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Génère un modèle Excel vide à télécharger
 */
export function telechargerModele(): void {
  const workbook = XLSX.utils.book_new();

  // En-têtes du relevé
  const entetes = [
    ['Date', 'Client / chantier', 'Motif', 'Km départ', 'Km arrivée', 'Péage / parking', 'Carburant', 'Commentaire'],
    ['2026-01-15', 'Client Exemple', 'Visite chantier', 15000, 15045, 5.50, 0, 'Aller-retour'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(entetes);
  XLSX.utils.book_append_sheet(workbook, ws, 'Relevé');

  XLSX.writeFile(workbook, 'modele_releve_kilometrique.xlsx');
}

/**
 * Formate un montant en euros
 */
export function formaterEuros(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant);
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formaterNombre(nombre: number): string {
  return new Intl.NumberFormat('fr-FR').format(nombre);
}

/**
 * Retourne le nom du mois en français
 */
export function getNomMois(mois: number): string {
  return MOIS_FR[mois - 1] || '';
}
