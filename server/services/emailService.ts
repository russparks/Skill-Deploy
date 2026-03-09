import { Resend } from "resend";
import { log } from "../index";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "onboarding@resend.dev";

export async function sendCertificateEmail(
  to: string,
  userName: string,
  sectionTitle: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    log(`[Email Fallback] Would send certificate to ${to} for "${sectionTitle}" - No email service configured`, "email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
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
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    if (error) {
      log(`Failed to send email to ${to}: ${JSON.stringify(error)}`, "email");
      return false;
    }

    log(`Certificate email sent to ${to} for "${sectionTitle}"`, "email");
    return true;
  } catch (error) {
    log(`Failed to send email to ${to}: ${error}`, "email");
    return false;
  }
}

export async function sendCompletionEmail(
  to: string,
  userName: string,
  referenceCode: string,
  returnUrl: string,
  userId: number
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    log(`[Email Fallback] Would send completion email to ${to} with ref ${referenceCode} - No email service configured`, "email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Training Complete - Your Unique Code`,
      html: `
        <h2>Congratulations, ${userName}!</h2>
        <p>You have successfully completed all training modules.</p>
        <p>Your unique reference code is: <strong style="font-size: 1.4em; letter-spacing: 2px;">${referenceCode}</strong></p>
        <p>Please save this code for your records. You can use it to verify your training completion.</p>
        <br/>
        <h3>Useful Links</h3>
        <ul>
          <li><strong>Download Training Material:</strong> <a href="${returnUrl}/api/training-material/download">Download Training PDF</a></li>
          <li><strong>Download Certificates:</strong> <a href="${returnUrl}/api/certificates/download-all/${userId}">Download All Certificates</a></li>
          <li><strong>Share Training:</strong> Copy this link to share the training with others: <a href="${returnUrl}">${returnUrl}</a></li>
        </ul>
        <br/>
        <p>If you need to retake the training in the future, you can return here:</p>
        <p><a href="${returnUrl}">${returnUrl}</a></p>
        <br/>
        <p><em>Privacy-Focused Training Platform</em></p>
      `,
    });

    if (error) {
      log(`Failed to send completion email to ${to}: ${JSON.stringify(error)}`, "email");
      return false;
    }

    log(`Completion email sent to ${to} with ref ${referenceCode}`, "email");
    return true;
  } catch (error) {
    log(`Failed to send completion email to ${to}: ${error}`, "email");
    return false;
  }
}
