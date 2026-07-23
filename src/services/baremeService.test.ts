import { describe, expect, it } from 'vitest';
import type { BaremeKilometrique, Deplacement } from '../types';
import {
  BAREME_2026,
  calculerIndemniteKilometrique,
  calculerKmParcourus,
  calculerTotalFrais,
  enrichirDeplacement,
  genererRecapMensuel,
  genererSyntheseAnnuelle,
  validerDeplacement,
} from './baremeService';

function creerDeplacement(overrides: Partial<Deplacement> = {}): Deplacement {
  return {
    id: 'test-id',
    date: '2026-03-15',
    client: 'Client Test',
    motif: 'Visite chantier',
    kmDepart: 1000,
    kmArrivee: 1100,
    peage: 5,
    carburant: 10,
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('calculerKmParcourus', () => {
  it('calcule la distance parcourue', () => {
    expect(calculerKmParcourus(1000, 1100)).toBe(100);
  });

  it('accepte un trajet à distance nulle', () => {
    expect(calculerKmParcourus(1000, 1000)).toBe(0);
  });

  it("lève une erreur si l'arrivée est avant le départ", () => {
    expect(() => calculerKmParcourus(1100, 1000)).toThrow();
  });
});

describe('calculerTotalFrais', () => {
  it('additionne péage et carburant', () => {
    expect(calculerTotalFrais(5, 10)).toBe(15);
  });

  it('gère les frais nuls', () => {
    expect(calculerTotalFrais(0, 0)).toBe(0);
  });
});

describe('calculerIndemniteKilometrique', () => {
  it('applique le taux 1 en dessous du seuil 1', () => {
    expect(calculerIndemniteKilometrique(3000, BAREME_2026)).toBeCloseTo(3000 * 0.665);
  });

  it('applique le taux 1 exactement au seuil 1', () => {
    expect(calculerIndemniteKilometrique(5000, BAREME_2026)).toBeCloseTo(5000 * 0.665);
  });

  it('applique le taux 2 + forfait entre les deux seuils', () => {
    expect(calculerIndemniteKilometrique(15000, BAREME_2026)).toBeCloseTo(15000 * 0.374 + 1457);
  });

  it('applique le taux 2 + forfait exactement au seuil 2', () => {
    expect(calculerIndemniteKilometrique(20000, BAREME_2026)).toBeCloseTo(20000 * 0.374 + 1457);
  });

  it('applique le taux 3 au-delà du seuil 2', () => {
    expect(calculerIndemniteKilometrique(25000, BAREME_2026)).toBeCloseTo(25000 * 0.447);
  });

  it('retourne 0 pour un kilométrage nul', () => {
    expect(calculerIndemniteKilometrique(0, BAREME_2026)).toBe(0);
  });

  it('lève une erreur pour un kilométrage négatif', () => {
    expect(() => calculerIndemniteKilometrique(-10, BAREME_2026)).toThrow();
  });
});

describe('enrichirDeplacement', () => {
  it('calcule kmParcourus, totalFrais, annee et mois', () => {
    const d = creerDeplacement({ date: '2026-07-15', kmDepart: 1000, kmArrivee: 1250, peage: 3, carburant: 12 });
    const enrichi = enrichirDeplacement(d);

    expect(enrichi.kmParcourus).toBe(250);
    expect(enrichi.totalFrais).toBe(15);
    expect(enrichi.annee).toBe(2026);
    expect(enrichi.mois).toBe(7);
  });
});

describe('genererRecapMensuel', () => {
  it('retourne 12 mois initialisés à zéro sans déplacement', () => {
    const recap = genererRecapMensuel([], 2026, BAREME_2026);
    expect(recap).toHaveLength(12);
    expect(recap.every(m => m.kmParcourus === 0 && m.totalFrais === 0 && m.indemnite === 0)).toBe(true);
  });

  it('ignore les déplacements des autres années', () => {
    const d = creerDeplacement({ date: '2025-01-10', kmDepart: 0, kmArrivee: 100 });
    const recap = genererRecapMensuel([d], 2026, BAREME_2026);
    expect(recap.every(m => m.kmParcourus === 0)).toBe(true);
  });

  it('agrège les km et frais par mois et cumule l\'indemnité', () => {
    const janvier = creerDeplacement({ id: '1', date: '2026-01-05', kmDepart: 0, kmArrivee: 1000, peage: 2, carburant: 8 });
    const fevrier = creerDeplacement({ id: '2', date: '2026-02-10', kmDepart: 1000, kmArrivee: 2000, peage: 1, carburant: 4 });

    const recap = genererRecapMensuel([janvier, fevrier], 2026, BAREME_2026);

    expect(recap[0].kmParcourus).toBe(1000);
    expect(recap[0].totalFrais).toBe(10);
    expect(recap[0].indemnite).toBeCloseTo(1000 * 0.665);

    expect(recap[1].kmParcourus).toBe(1000);
    expect(recap[1].totalFrais).toBe(5);
    // Indemnité cumulée sur 2000 km au total
    expect(recap[1].indemnite).toBeCloseTo(2000 * 0.665);
  });
});

describe('genererSyntheseAnnuelle', () => {
  it('calcule les totaux annuels et le total général', () => {
    const d1 = creerDeplacement({ id: '1', date: '2026-01-05', kmDepart: 0, kmArrivee: 4000, peage: 10, carburant: 40 });
    const d2 = creerDeplacement({ id: '2', date: '2026-06-10', kmDepart: 4000, kmArrivee: 6000, peage: 5, carburant: 20 });

    const synthese = genererSyntheseAnnuelle([d1, d2], 2026, BAREME_2026);

    expect(synthese.totalKm).toBe(6000);
    expect(synthese.totalFrais).toBe(75);
    expect(synthese.indemniteAnnuelle).toBeCloseTo(6000 * 0.374 + 1457);
    expect(synthese.totalGeneral).toBeCloseTo(synthese.totalFrais + synthese.indemniteAnnuelle);
  });

  it('gère une année sans déplacement', () => {
    const synthese = genererSyntheseAnnuelle([], 2026, BAREME_2026);
    expect(synthese.totalKm).toBe(0);
    expect(synthese.totalFrais).toBe(0);
    expect(synthese.indemniteAnnuelle).toBe(0);
    expect(synthese.totalGeneral).toBe(0);
  });
});

describe('validerDeplacement', () => {
  it('ne retourne aucune erreur pour un déplacement valide', () => {
    expect(validerDeplacement(creerDeplacement())).toEqual([]);
  });

  it('signale la date manquante ou invalide', () => {
    expect(validerDeplacement(creerDeplacement({ date: '' }))).toContain('La date est obligatoire');
    expect(validerDeplacement(creerDeplacement({ date: 'pas-une-date' }))).toContain('La date est invalide');
  });

  it('signale le client et le motif manquants', () => {
    const erreurs = validerDeplacement(creerDeplacement({ client: '  ', motif: '' }));
    expect(erreurs).toContain('Le client/chantier est obligatoire');
    expect(erreurs).toContain('Le motif est obligatoire');
  });

  it("signale un kilométrage d'arrivée inférieur au départ", () => {
    const erreurs = validerDeplacement(creerDeplacement({ kmDepart: 200, kmArrivee: 100 }));
    expect(erreurs).toContain('Le kilométrage d\'arrivée doit être supérieur ou égal au kilométrage de départ');
  });

  it('signale des frais négatifs', () => {
    const erreurs = validerDeplacement(creerDeplacement({ peage: -1, carburant: -1 }));
    expect(erreurs).toContain('Les frais de péage ne peuvent pas être négatifs');
    expect(erreurs).toContain('Les frais de carburant ne peuvent pas être négatifs');
  });
});

describe('barème personnalisé', () => {
  it('respecte un barème différent de celui par défaut', () => {
    const baremeCustom: BaremeKilometrique = {
      annee: 2027,
      seuil1: 1000,
      seuil2: 5000,
      taux1: 1,
      taux2: 0.5,
      forfait2: 100,
      taux3: 0.2,
    };

    expect(calculerIndemniteKilometrique(500, baremeCustom)).toBe(500);
    expect(calculerIndemniteKilometrique(3000, baremeCustom)).toBe(3000 * 0.5 + 100);
    expect(calculerIndemniteKilometrique(10000, baremeCustom)).toBe(10000 * 0.2);
  });
});
