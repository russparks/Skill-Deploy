import PDFDocument from "pdfkit";

interface CertificateOptions {
  userName: string;
  sectionTitle: string;
  completionDate: Date;
  organization?: string | null;
}

interface TrainingSection {
  title: string;
  description?: string | null;
  content: string;
  orderIndex: number;
  estimatedMinutes?: number | null;
}

export async function generateCertificatePDF(options: CertificateOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 50, bottom: 50, left: 72, right: 72 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width;
    const centerX = width / 2;

    doc.rect(20, 20, width - 40, doc.page.height - 40)
      .lineWidth(3)
      .strokeColor("#0284c7")
      .stroke();

    doc.rect(30, 30, width - 60, doc.page.height - 60)
      .lineWidth(1)
      .strokeColor("#0ea5e9")
      .stroke();

    doc.fontSize(14)
      .fillColor("#64748b")
      .text("CERTIFICATE OF COMPLETION", 0, 80, { align: "center", width });

    doc.moveDown(1);

    doc.fontSize(36)
      .fillColor("#0c4a6e")
      .text("Privacy Training", 0, 120, { align: "center", width });

    doc.moveDown(1.5);

    doc.fontSize(14)
      .fillColor("#475569")
      .text("This certifies that", 0, 200, { align: "center", width });

    doc.moveDown(0.5);

    doc.fontSize(28)
      .fillColor("#0f172a")
      .text(options.userName, 0, 230, { align: "center", width });

    if (options.organization) {
      doc.moveDown(0.3);
      doc.fontSize(14)
        .fillColor("#64748b")
        .text(`of ${options.organization}`, 0, 270, { align: "center", width });
    }

    doc.moveDown(1);

    const orgOffset = options.organization ? 20 : 0;

    doc.fontSize(14)
      .fillColor("#475569")
      .text("has successfully completed the training module", 0, 300 + orgOffset, { align: "center", width });

    doc.moveDown(0.5);

    doc.fontSize(22)
      .fillColor("#0284c7")
      .text(`"${options.sectionTitle}"`, 0, 330 + orgOffset, { align: "center", width });

    doc.moveDown(2);

    const dateStr = options.completionDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.fontSize(12)
      .fillColor("#64748b")
      .text(`Completed on ${dateStr}`, 0, 400 + orgOffset, { align: "center", width });

    doc.moveDown(3);

    const lineY = 460 + orgOffset;
    doc.moveTo(centerX - 100, lineY)
      .lineTo(centerX + 100, lineY)
      .lineWidth(1)
      .strokeColor("#cbd5e1")
      .stroke();

    doc.fontSize(10)
      .fillColor("#94a3b8")
      .text("Privacy-Focused Training Platform", 0, lineY + 10, { align: "center", width });

    doc.end();
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "  • ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateTrainingMaterialPDF(sections: TrainingSection[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width - 120;

    doc.fontSize(28)
      .fillColor("#0c4a6e")
      .text("Privacy Training Material", { align: "center", width });

    doc.moveDown(0.5);

    doc.fontSize(12)
      .fillColor("#64748b")
      .text("Complete Training Guide", { align: "center", width });

    doc.moveDown(2);

    doc.moveTo(60, doc.y)
      .lineTo(doc.page.width - 60, doc.y)
      .lineWidth(1)
      .strokeColor("#e2e8f0")
      .stroke();

    doc.moveDown(1);

    const sorted = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

    sorted.forEach((section, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.fontSize(18)
        .fillColor("#0c4a6e")
        .text(`Module ${index + 1}: ${section.title}`, { width });

      if (section.description) {
        doc.moveDown(0.5);
        doc.fontSize(11)
          .fillColor("#64748b")
          .text(section.description, { width });
      }

      if (section.estimatedMinutes) {
        doc.moveDown(0.3);
        doc.fontSize(9)
          .fillColor("#94a3b8")
          .text(`Estimated time: ${section.estimatedMinutes} minutes`, { width });
      }

      doc.moveDown(1);

      doc.moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .lineWidth(0.5)
        .strokeColor("#e2e8f0")
        .stroke();

      doc.moveDown(1);

      const plainContent = stripHtml(section.content);
      doc.fontSize(11)
        .fillColor("#1e293b")
        .text(plainContent, { width, lineGap: 4 });
    });

    doc.end();
  });
}

export async function generateAllCertificatesPDF(entries: CertificateOptions[]): Promise<Buffer> {
  const buffers: Buffer[] = [];

  for (const entry of entries) {
    const buf = await generateCertificatePDF(entry);
    buffers.push(buf);
  }

  if (buffers.length === 1) return buffers[0];

  const PDFDoc = (await import("pdf-lib")).PDFDocument;
  const merged = await PDFDoc.create();

  for (const buf of buffers) {
    const source = await PDFDoc.load(buf);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  return Buffer.from(mergedBytes);
}
