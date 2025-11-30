import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * exportCSV:
 *  - filename: string
 *  - headers: array of column headers
 *  - rows: array of arrays (each inner array is a row's columns)
 */
export function exportCSV(
  filename: string,
  headers: (string | number)[],
  rows: (string | number)[][]
): void {
  const csv = [headers.map(String).join(","), ...rows.map((r) => r.map(String).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * exportPDF:
 *  - title: shown at top
 *  - filename: saved file name
 *  - headers: column headers
 *  - rows: rows data
 *  - footer: optional footer line (string)
 *
 * Note: we cast to any only where necessary to access runtime props added by autotable.
 */
export function exportPDF(
  title: string,
  filename: string,
  headers: (string | number)[],
  rows: (string | number)[][],
  footer?: string
): void {
  const doc = new jsPDF();
  const now = new Date().toLocaleString();

  doc.setFontSize(14);
  doc.text(String(title), 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${now}`, 14, 28);

  // call autotable; types vary by version so cast to any
  (autoTable as any)(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: "striped",
  });

  // access lastAutoTable.finalY (runtime property)
  const finalY = (doc as any).lastAutoTable?.finalY ?? 34 + 10;

  if (footer) {
    doc.setFontSize(10);
    doc.text(String(footer), 14, finalY + 8);
  }

  doc.save(filename);
}
