import { describe, expect, it } from 'vitest';
import { formaterEuros, formaterNombre, getNomMois } from './excelService';

describe('formaterEuros', () => {
  it('formate un montant en euros au format français', () => {
    // Espace insécable entre le nombre et le symbole €
    expect(formaterEuros(1234.5).replace(/\s/g, ' ')).toContain('1 234,50');
    expect(formaterEuros(1234.5)).toContain('€');
  });

  it('gère le montant zéro', () => {
    expect(formaterEuros(0)).toContain('0,00');
  });
});

describe('formaterNombre', () => {
  it('ajoute un séparateur de milliers', () => {
    expect(formaterNombre(12345).replace(/\s/g, ' ')).toBe('12 345');
  });

  it('gère les petits nombres', () => {
    expect(formaterNombre(42)).toBe('42');
  });
});

describe('getNomMois', () => {
  it('retourne le nom du mois en français', () => {
    expect(getNomMois(1)).toBe('Janvier');
    expect(getNomMois(12)).toBe('Décembre');
  });

  it('retourne une chaîne vide pour un mois invalide', () => {
    expect(getNomMois(0)).toBe('');
    expect(getNomMois(13)).toBe('');
  });
});
