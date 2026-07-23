/**
 * Types TypeScript pour l'application Kilométrique
 * Basés sur la structure du fichier releve_kilometrique.xlsx
 */

// ============================================
// PARAMÈTRES ET BARÈME
// ============================================

/**
 * Barème kilométrique par tranches (barème URSSAF)
 */
export interface BaremeKilometrique {
  /** Année d'application du barème */
  annee: number;
  /** Seuil 1 en km (ex: 5000) */
  seuil1: number;
  /** Seuil 2 en km (ex: 20000) */
  seuil2: number;
  /** Taux pour km <= seuil1 (ex: 0.665 €/km) */
  taux1: number;
  /** Coefficient pour seuil1 < km <= seuil2 (ex: 0.374) */
  taux2: number;
  /** Montant forfaitaire pour tranche 2 (ex: 1457 €) */
  forfait2: number;
  /** Taux pour km > seuil2 (ex: 0.447 €/km) */
  taux3: number;
}

/**
 * Paramètres généraux de l'application
 */
export interface Parametres {
  /** Année fiscale en cours */
  anneeFiscale: number;
  /** Barème kilométrique applicable */
  bareme: BaremeKilometrique;
}

// ============================================
// DÉPLACEMENT
// ============================================

/**
 * Un déplacement/trajet professionnel
 */
export interface Deplacement {
  /** Identifiant unique */
  id: string;
  /** Date du déplacement (ISO 8601) */
  date: string;
  /** Client ou chantier */
  client: string;
  /** Motif du déplacement */
  motif: string;
  /** Kilométrage au départ */
  kmDepart: number;
  /** Kilométrage à l'arrivée */
  kmArrivee: number;
  /** Frais de péage/parking en euros */
  peage: number;
  /** Frais de carburant en euros */
  carburant: number;
  /** Commentaire optionnel */
  commentaire?: string;
  /** Date de création */
  createdAt: string;
  /** Date de dernière modification */
  updatedAt: string;
}

/**
 * Déplacement avec champs calculés
 */
export interface DeplacementCalcule extends Deplacement {
  /** Kilomètres parcourus (calculé) */
  kmParcourus: number;
  /** Total des frais annexes (calculé) */
  totalFrais: number;
  /** Année extraite de la date (calculé) */
  annee: number;
  /** Mois extrait de la date (calculé) */
  mois: number;
}

// ============================================
// SYNTHÈSE
// ============================================

/**
 * Récapitulatif mensuel
 */
export interface RecapMensuel {
  /** Numéro du mois (1-12) */
  mois: number;
  /** Nom du mois en français */
  nomMois: string;
  /** Total kilomètres parcourus */
  kmParcourus: number;
  /** Total frais (péage + carburant) */
  totalFrais: number;
  /** Indemnité kilométrique calculée */
  indemnite: number;
}

/**
 * Synthèse annuelle complète
 */
export interface SyntheseAnnuelle {
  /** Année fiscale */
  annee: number;
  /** Récapitulatif par mois */
  mois: RecapMensuel[];
  /** Total annuel kilomètres */
  totalKm: number;
  /** Total annuel frais */
  totalFrais: number;
  /** Indemnité kilométrique annuelle */
  indemniteAnnuelle: number;
  /** Total général (frais + indemnité) */
  totalGeneral: number;
}

// ============================================
// IMPORT/EXPORT EXCEL
// ============================================

/**
 * Structure d'une ligne du fichier Excel "Relevé"
 */
export interface LigneExcelReleve {
  Date: string;
  'Client / chantier': string;
  Motif: string;
  'Km départ': number;
  'Km arrivée': number;
  'Km parcourus': number;
  'Péage / parking': number;
  Carburant: number;
  'Total frais': number;
  Commentaire?: string;
  Année: number;
  Mois: number;
}

/**
 * Structure d'une ligne du fichier Excel "Synthèse"
 */
export interface LigneExcelSynthese {
  'N° mois': number;
  Mois: string;
  'Km parcourus': number;
  'Frais (péage/parking + carburant)': number;
}

// ============================================
// ÉTAT APPLICATION
// ============================================

/**
 * État global de l'application
 */
export interface AppState {
  /** Paramètres de configuration */
  parametres: Parametres;
  /** Liste des déplacements */
  deplacements: Deplacement[];
  /** Déplacement en cours d'édition (null si nouveau) */
  deplacementEnCours: Deplacement | null;
  /** Filtre année */
  filtreAnnee: number;
  /** Filtre mois (0 = tous) */
  filtreMois: number;
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Résultat d'une opération
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Options d'export
 */
export interface ExportOptions {
  /** Inclure le détail des trajets */
  inclureDetail: boolean;
  /** Inclure le récapitulatif mensuel */
  inclureRecap: boolean;
  /** Inclure les paramètres du barème */
  inclureParametres: boolean;
}
