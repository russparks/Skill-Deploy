import { Resend } from "resend";
import { log } from "../index";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "onboarding@resend.dev";
const ADMIN_EMAIL = "info@axislabs.co.uk";

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
        <p><em>Quick Skill - Onboarding The Works</em></p>
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
      subject: `Training Complete - Your Unique Reference Code`,
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f8;margin:0;padding:20px 40px 40px 40px">

  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:30px;box-shadow:0 4px 10px rgba(0,0,0,0.08)">

    <div style="text-align:center;margin-bottom:20px">
      <div style="width:60px;height:70px;background:#e5e7eb;border-radius:6px;margin:0 auto"></div>
    </div>

    <div style="font-size:22px;font-weight:bold;margin-bottom:10px;text-align:center">
      Congratulations, ${userName}!
    </div>

    <div style="color:#666;margin-bottom:20px;text-align:center">
      You have successfully completed all training modules.
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0">

    <div style="text-align:center;background:#f8fafc;padding:18px;border-radius:8px;max-width:420px;margin:0 auto">
      <div style="font-size:40px;font-weight:bold;font-family:Courier New,monospace;background:#f1f3f5;padding:14px 18px;border-radius:6px;display:inline-block;margin:10px 0;border:1px dashed #cbd5e1;letter-spacing:3px">
        ${referenceCode}
      </div>

      <div style="font-size:12px;color:#777;margin-top:6px;letter-spacing:0.5px">
        Unique Reference Code
      </div>

      <div style="font-size:11px;color:#999;margin-top:6px">
        Tip: select or tap and hold to copy
      </div>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0">

    <div style="text-align:center;max-width:420px;margin:0 auto">
      Please save this code for your records, you will be asked for it by the Information Management team. Your certificates and the training material can be downloaded below.
    </div>

    <div style="margin-top:30px">

      <a href="${returnUrl}/api/training-material/download"
        style="display:block;margin:10px auto;color:#1e3a8a;text-decoration:none;max-width:420px;text-align:center;font-size:140%;padding:16px 18px;border-radius:6px;font-weight:bold;background:#edf2ff">
        ⬇ Training Material<br/>
        <span style="font-weight:normal;font-size:12px;color:#555">always available</span>
      </a>

      <a href="${returnUrl}/api/certificates/download-all/${userId}"
        style="display:block;margin:10px auto;color:#1e3a8a;text-decoration:none;max-width:420px;text-align:center;font-size:140%;padding:16px 18px;border-radius:6px;font-weight:bold;background:#e6fffa">
        ⬇ Certificates<br/>
        <span style="font-weight:normal;font-size:12px;color:#555">link expires in 30min</span>
      </a>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0">

      <a href="${returnUrl}"
        style="display:block;margin:10px auto;color:#1e3a8a;text-decoration:none;max-width:420px;text-align:center;font-size:140%;padding:16px 18px;border-radius:6px;font-weight:bold;background:#f0fff4">
        ⇪ Share Training<br/>
        <span style="font-weight:normal;font-size:12px;color:#555">for others that need training</span>
      </a>

    </div>

  </div>

  <div style="text-align:center;color:#777;font-size:12px;padding-bottom:30px;margin-top:30px">
    Quick Skill - Onboarding The Works
  </div>

</div>
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

export async function sendAdminNotificationEmail(
  userName: string,
  referenceCode: string
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    log(`[Email Fallback] Would send admin notification for ${userName} - No email service configured`, "email");
    return false;
  }

  const initials = userName
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject: `Training Completed - ${initials}`,
      html: `
        <h3>Training Completion Notification</h3>
        <p>A trainee has completed all training modules.</p>
        <ul>
          <li><strong>Initials:</strong> ${initials}</li>
          <li><strong>URN:</strong> ${referenceCode}</li>
        </ul>
        <p><em>Quick Skill - Onboarding The Works</em></p>
      `,
    });

    if (error) {
      log(`Failed to send admin notification: ${JSON.stringify(error)}`, "email");
      return false;
    }

    log(`Admin notification sent for ${initials} (${referenceCode})`, "email");
    return true;
  } catch (error) {
    log(`Failed to send admin notification: ${error}`, "email");
    return false;
  }
}
