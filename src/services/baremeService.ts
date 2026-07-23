import type { BaremeKilometrique, Deplacement, DeplacementCalcule, RecapMensuel, SyntheseAnnuelle } from '../types';

/**
 * Service de calcul des indemnités kilométriques
 * Implémente le barème URSSAF par tranches
 */

// ============================================
// CONSTANTES
// ============================================

/** Noms des mois en français */
export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
] as const;

/** Barème 2026 par défaut (à ajuster selon puissance fiscale) */
export const BAREME_2026: BaremeKilometrique = {
  annee: 2026,
  seuil1: 5000,
  seuil2: 20000,
  taux1: 0.665,
  taux2: 0.374,
  forfait2: 1457,
  taux3: 0.447,
};

// ============================================
// CALCULS DE BASE
// ============================================

/**
 * Calcule les kilomètres parcourus
 * @param kmDepart Kilométrage au départ
 * @param kmArrivee Kilométrage à l'arrivée
 * @returns Kilomètres parcourus
 * @throws Error si kmArrivee < kmDepart
 */
export function calculerKmParcourus(kmDepart: number, kmArrivee: number): number {
  if (kmArrivee < kmDepart) {
    throw new Error(`Le kilométrage d'arrivée (${kmArrivee}) ne peut pas être inférieur au kilométrage de départ (${kmDepart})`);
  }
  return kmArrivee - kmDepart;
}

/**
 * Calcule le total des frais annexes
 * @param peage Frais de péage/parking
 * @param carburant Frais de carburant
 * @returns Total des frais
 */
export function calculerTotalFrais(peage: number, carburant: number): number {
  return peage + carburant;
}

// ============================================
// CALCUL INDEMNITÉ KILOMÉTRIQUE
// ============================================

/**
 * Calcule l'indemnité kilométrique selon le barème URSSAF
 *
 * Barème par tranches :
 * - km ≤ seuil1 : km × taux1
 * - seuil1 < km ≤ seuil2 : km × taux2 + forfait2
 * - km > seuil2 : km × taux3
 *
 * @param kmTotal Kilomètres totaux parcourus dans l'année
 * @param bareme Barème applicable
 * @returns Indemnité kilométrique en euros
 *
 * @example
 * // 3000 km avec barème 2026
 * calculerIndemniteKilometrique(3000, BAREME_2026) // 3000 × 0.665 = 1995 €
 *
 * @example
 * // 15000 km avec barème 2026
 * calculerIndemniteKilometrique(15000, BAREME_2026) // 15000 × 0.374 + 1457 = 7067 €
 */
export function calculerIndemniteKilometrique(kmTotal: number, bareme: BaremeKilometrique): number {
  if (kmTotal < 0) {
    throw new Error('Le kilométrage total ne peut pas être négatif');
  }

  if (kmTotal <= bareme.seuil1) {
    return kmTotal * bareme.taux1;
  }

  if (kmTotal <= bareme.seuil2) {
    return kmTotal * bareme.taux2 + bareme.forfait2;
  }

  return kmTotal * bareme.taux3;
}

// ============================================
// ENRICHISSEMENT DÉPLACEMENT
// ============================================

/**
 * Enrichit un déplacement avec les champs calculés
 * @param deplacement Déplacement brut
 * @returns Déplacement avec kmParcourus, totalFrais, annee, mois
 */
export function enrichirDeplacement(deplacement: Deplacement): DeplacementCalcule {
  const date = new Date(deplacement.date);

  return {
    ...deplacement,
    kmParcourus: calculerKmParcourus(deplacement.kmDepart, deplacement.kmArrivee),
    totalFrais: calculerTotalFrais(deplacement.peage, deplacement.carburant),
    annee: date.getFullYear(),
    mois: date.getMonth() + 1, // 1-12
  };
}

// ============================================
// SYNTHÈSE MENSUELLE ET ANNUELLE
// ============================================

/**
 * Génère le récapitulatif mensuel pour une année donnée
 * @param deplacements Liste des déplacements de l'année
 * @param annee Année fiscale
 * @param bareme Barème applicable
 * @returns Tableau des 12 mois avec totaux
 */
export function genererRecapMensuel(
  deplacements: Deplacement[],
  annee: number,
  bareme: BaremeKilometrique
): RecapMensuel[] {
  // Initialiser les 12 mois
  const recap: RecapMensuel[] = MOIS_FR.map((nomMois, index) => ({
    mois: index + 1,
    nomMois,
    kmParcourus: 0,
    totalFrais: 0,
    indemnite: 0,
  }));

  // Agréger les déplacements par mois
  let kmCumulAnnee = 0;

  deplacements
    .map(enrichirDeplacement)
    .filter(d => d.annee === annee)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(d => {
      const moisIndex = d.mois - 1;
      recap[moisIndex].kmParcourus += d.kmParcourus;
      recap[moisIndex].totalFrais += d.totalFrais;
      kmCumulAnnee += d.kmParcourus;
      // L'indemnité est calculée sur le cumul annuel à ce stade
      recap[moisIndex].indemnite = calculerIndemniteKilometrique(kmCumulAnnee, bareme);
    });

  return recap;
}

/**
 * Génère la synthèse annuelle complète
 * @param deplacements Liste des déplacements
 * @param annee Année fiscale
 * @param bareme Barème applicable
 * @returns Synthèse annuelle avec tous les totaux
 */
export function genererSyntheseAnnuelle(
  deplacements: Deplacement[],
  annee: number,
  bareme: BaremeKilometrique
): SyntheseAnnuelle {
  const mois = genererRecapMensuel(deplacements, annee, bareme);

  const totalKm = mois.reduce((sum, m) => sum + m.kmParcourus, 0);
  const totalFrais = mois.reduce((sum, m) => sum + m.totalFrais, 0);
  const indemniteAnnuelle = calculerIndemniteKilometrique(totalKm, bareme);

  return {
    annee,
    mois,
    totalKm,
    totalFrais,
    indemniteAnnuelle,
    totalGeneral: totalFrais + indemniteAnnuelle,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valide un déplacement avant sauvegarde
 * @param deplacement Déplacement à valider
 * @returns Liste des erreurs (vide si valide)
 */
export function validerDeplacement(deplacement: Partial<Deplacement>): string[] {
  const erreurs: string[] = [];

  if (!deplacement.date) {
    erreurs.push('La date est obligatoire');
  } else if (isNaN(new Date(deplacement.date).getTime())) {
    erreurs.push('La date est invalide');
  }

  if (!deplacement.client?.trim()) {
    erreurs.push('Le client/chantier est obligatoire');
  }

  if (!deplacement.motif?.trim()) {
    erreurs.push('Le motif est obligatoire');
  }

  if (deplacement.kmDepart === undefined || deplacement.kmDepart < 0) {
    erreurs.push('Le kilométrage de départ est obligatoire et doit être positif');
  }

  if (deplacement.kmArrivee === undefined || deplacement.kmArrivee < 0) {
    erreurs.push('Le kilométrage d\'arrivée est obligatoire et doit être positif');
  }

  if (deplacement.kmDepart !== undefined && deplacement.kmArrivee !== undefined) {
    if (deplacement.kmArrivee < deplacement.kmDepart) {
      erreurs.push('Le kilométrage d\'arrivée doit être supérieur ou égal au kilométrage de départ');
    }
  }

  if (deplacement.peage !== undefined && deplacement.peage < 0) {
    erreurs.push('Les frais de péage ne peuvent pas être négatifs');
  }

  if (deplacement.carburant !== undefined && deplacement.carburant < 0) {
    erreurs.push('Les frais de carburant ne peuvent pas être négatifs');
  }

  return erreurs;
}
