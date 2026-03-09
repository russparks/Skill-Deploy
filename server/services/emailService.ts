import nodemailer from "nodemailer";
import { log } from "../index";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return transporter;
  }

  return null;
}

export async function sendCertificateEmail(
  to: string,
  userName: string,
  sectionTitle: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    log(`[Email Fallback] Would send certificate to ${to} for "${sectionTitle}" - No email service configured`, "email");
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || "training@example.com",
      to,
      subject: `Training Certificate: ${sectionTitle}`,
      html: `
        <h2>Congratulations, ${userName}!</h2>
        <p>You have successfully completed the training module: <strong>${sectionTitle}</strong></p>
        <p>Your certificate is attached to this email.</p>
        <br/>
        <p><em>Privacy-Focused Training Platform</em></p>
      `,
      attachments: [
        {
          filename: `certificate-${sectionTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    log(`Certificate email sent to ${to} for "${sectionTitle}"`, "email");
    return true;
  } catch (error) {
    log(`Failed to send email to ${to}: ${error}`, "email");
    return false;
  }
}
