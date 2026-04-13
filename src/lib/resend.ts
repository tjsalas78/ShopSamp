import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@prodsamp.app";
const APP_NAME = "ProdSamp";

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Reset your password</h1>
          <p style="color: #555; margin-bottom: 24px;">
            Someone requested a password reset for your <strong>${APP_NAME}</strong> account.
            If this was you, click the button below. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.<br/>
            Or copy this link: <a href="${resetUrl}" style="color: #16a34a;">${resetUrl}</a>
          </p>
        </body>
      </html>
    `,
  });
}
