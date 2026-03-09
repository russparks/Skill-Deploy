import PDFDocument from "pdfkit";

interface CertificateOptions {
  userName: string;
  sectionTitle: string;
  completionDate: Date;
  organization?: string | null;
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
