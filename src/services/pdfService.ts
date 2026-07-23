import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Deplacement, Parametres } from '../types';
import { enrichirDeplacement, genererSyntheseAnnuelle } from './baremeService';
import { formaterEuros, formaterNombre } from './excelService';

/**
 * Génération du PDF officiel "Note de frais kilométriques"
 * Document destiné à servir de justificatif pour une déclaration
 * de frais réels (impôts) ou à être partagé (ex: WhatsApp).
 */

interface DocAvecAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

const COULEUR_ACCENT: [number, number, number] = [170, 59, 255];
const COULEUR_TEXTE: [number, number, number] = [30, 30, 35];
const COULEUR_GRIS: [number, number, number] = [110, 110, 120];
const COULEUR_LIGNE_ALT: [number, number, number] = [246, 244, 250];

function dessinerPiedDePage(doc: DocAvecAutoTable, marge: number, pageWidth: number): void {
  const hauteurPage = doc.internal.pageSize.getHeight();
  const pageCourante = doc.getNumberOfPages();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COULEUR_GRIS);
  doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}`, marge, hauteurPage - 8);
  doc.text(`Page ${pageCourante}`, pageWidth - marge, hauteurPage - 8, { align: 'right' });
}

export function genererPdfReleve(
  deplacements: Deplacement[],
  parametres: Parametres,
  annee: number,
): void {
  const deplacementsAnnee = deplacements
    .map(enrichirDeplacement)
    .filter(d => d.annee === annee)
    .sort((a, b) => a.date.localeCompare(b.date));

  const synthese = genererSyntheseAnnuelle(deplacements, annee, parametres.bareme);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as DocAvecAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const hauteurPage = doc.internal.pageSize.getHeight();
  const marge = 14;

  // ============ En-tête ============
  doc.setFillColor(...COULEUR_ACCENT);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('NOTE DE FRAIS KILOMÉTRIQUES', marge, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Justificatif pour déclaration de frais réels — Année ${annee}`, marge, 23);

  // ============ Bloc identité ============
  let y = 40;

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: COULEUR_GRIS },
      1: { textColor: COULEUR_TEXTE },
    },
    body: [
      ['Déclarant', parametres.nomDeclarant?.trim() || '—'],
      ['Véhicule', parametres.vehicule?.trim() || '—'],
      ['Année fiscale', String(parametres.anneeFiscale)],
      ['Document généré le', new Date().toLocaleDateString('fr-FR')],
    ],
    margin: { left: marge, right: marge },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // ============ Détail des trajets ============
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COULEUR_TEXTE);
  doc.text('Détail des trajets', marge, y);
  y += 4;

  const corpsTrajets = deplacementsAnnee.map(d => [
    new Date(d.date).toLocaleDateString('fr-FR'),
    d.client,
    d.motif,
    formaterNombre(d.kmDepart),
    formaterNombre(d.kmArrivee),
    formaterNombre(d.kmParcourus),
    d.peage ? formaterEuros(d.peage) : '—',
    d.carburant ? formaterEuros(d.carburant) : '—',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Client / chantier', 'Motif', 'Km départ', 'Km arrivée', 'Km parcourus', 'Péage', 'Carburant']],
    body: corpsTrajets.length > 0
      ? corpsTrajets
      : [['—', 'Aucun déplacement enregistré pour cette année', '', '', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: COULEUR_ACCENT, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: COULEUR_TEXTE },
    alternateRowStyles: { fillColor: COULEUR_LIGNE_ALT },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    margin: { left: marge, right: marge },
    didDrawPage: () => dessinerPiedDePage(doc, marge, pageWidth),
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  if (y > hauteurPage - 70) {
    doc.addPage();
    dessinerPiedDePage(doc, marge, pageWidth);
    y = 20;
  }

  // ============ Synthèse annuelle ============
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COULEUR_TEXTE);
  doc.text('Synthèse annuelle', marge, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 3 },
    head: [['Total km', 'Frais (péage + carburant)', 'Indemnité kilométrique', 'Total général']],
    body: [[
      `${formaterNombre(synthese.totalKm)} km`,
      formaterEuros(synthese.totalFrais),
      formaterEuros(synthese.indemniteAnnuelle),
      formaterEuros(synthese.totalGeneral),
    ]],
    headStyles: { fillColor: COULEUR_TEXTE, textColor: 255, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { halign: 'center', fontStyle: 'bold', textColor: COULEUR_TEXTE },
    margin: { left: marge, right: marge },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;

  if (y > hauteurPage - 60) {
    doc.addPage();
    dessinerPiedDePage(doc, marge, pageWidth);
    y = 20;
  }

  // ============ Barème appliqué ============
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COULEUR_TEXTE);
  doc.text(`Barème kilométrique appliqué (${parametres.bareme.annee})`, marge, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9 },
    head: [['Tranche', 'Mode de calcul']],
    body: [
      [`Jusqu'à ${formaterNombre(parametres.bareme.seuil1)} km`, `distance × ${parametres.bareme.taux1} €/km`],
      [
        `De ${formaterNombre(parametres.bareme.seuil1)} à ${formaterNombre(parametres.bareme.seuil2)} km`,
        `(distance × ${parametres.bareme.taux2}) + ${formaterNombre(parametres.bareme.forfait2)} €`,
      ],
      [`Au-delà de ${formaterNombre(parametres.bareme.seuil2)} km`, `distance × ${parametres.bareme.taux3} €/km`],
    ],
    headStyles: { fillColor: [230, 228, 235], textColor: COULEUR_TEXTE, fontStyle: 'bold' },
    margin: { left: marge, right: marge },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 24;

  if (y > hauteurPage - 30) {
    doc.addPage();
    dessinerPiedDePage(doc, marge, pageWidth);
    y = 30;
  }

  // ============ Signature ============
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COULEUR_GRIS);
  doc.text('Fait à ________________________________, le ________________________', marge, y);
  y += 16;
  doc.text('Signature :', marge, y);
  doc.line(marge + 22, y, marge + 95, y);

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`note_frais_kilometriques_${annee}_${dateStr}.pdf`);
}
