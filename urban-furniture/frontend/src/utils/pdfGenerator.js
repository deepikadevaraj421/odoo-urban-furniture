import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Reusable PDF generator for Urban Furniture Financial Reports
export const generateReportPdf = ({
  reportTitle,
  periodText,
  kpiItems = [],
  tables = [],
  ratios = [],
  validationText,
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner
  doc.setFillColor(26, 71, 49); // Forest green #1a4731
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('URBAN FURNITURE', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('ACCOUNTING & FINANCIAL REPORTING', 14, 18);

  const printDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(`Generated: ${printDate}`, pageWidth - 14, 18, { align: 'right' });

  // 2. Report Subtitle & Period
  let currentY = 36;

  doc.setTextColor(33, 37, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(reportTitle.toUpperCase(), 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reporting Period: ${periodText}`, 14, currentY);

  currentY += 8;

  // 3. Compact KPI Summary Box
  if (kpiItems.length > 0) {
    const boxWidth = (pageWidth - 28 - (kpiItems.length - 1) * 4) / kpiItems.length;

    kpiItems.forEach((item, idx) => {
      const boxX = 14 + idx * (boxWidth + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(boxX, currentY, boxWidth, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, boxX + 4, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(26, 71, 49);
      doc.text(String(item.value), boxX + 4, currentY + 11);
    });

    currentY += 18;
  }

  // 4. Financial Ratios (if provided)
  if (ratios.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 10, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const ratioSpacing = (pageWidth - 32) / ratios.length;
    ratios.forEach((r, idx) => {
      doc.text(`${r.label}: ${r.value}`, 16 + idx * ratioSpacing, currentY + 6.5);
    });

    currentY += 14;
  }

  // 5. Tables Rendering via autoTable
  tables.forEach((tbl) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    if (tbl.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(26, 71, 49);
      doc.text(tbl.title, 14, currentY);
      currentY += 4;
    }

    doc.autoTable({
      startY: currentY,
      head: [tbl.headers],
      body: tbl.rows,
      theme: 'grid',
      headStyles: {
        fillColor: [26, 71, 49],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      columnStyles: tbl.columnStyles || {},
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        currentY = data.cursor.y;
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  });

  // 6. Validation text or footer note
  if (validationText) {
    if (currentY > 265) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(26, 71, 49);
    doc.text(validationText, 14, currentY);
    currentY += 6;
  }

  // 7. Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Urban Furniture ERP • Confidential Financial Document • Powered by PostgreSQL + Prisma Single Source of Truth',
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  // 8. Download PDF with clean filename
  const cleanTitle = reportTitle.replace(/\s+/g, '_');
  const dateSuffix = new Date().toISOString().split('T')[0];
  doc.save(`Urban_Furniture_${cleanTitle}_${dateSuffix}.pdf`);
};

export default generateReportPdf;
