interface ConfirmationTemplateProps {
  domain: string;
  token: string;
}

export function ConfirmationTemplate({
  domain,
  token,
}: ConfirmationTemplateProps) {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email Confirmation</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; padding:32px; box-shadow:0 8px 24px rgba(15, 23, 42, 0.08);">
            <tr>
              <td style="font-family:Arial, sans-serif;">
                <h1 style="margin:0 0 8px; font-size:24px;">Confirm your email address</h1>
                <p style="margin:0 0 12px; color:#475569; font-size:14px;">Hello!</p>
                <p style="margin:0 0 20px; font-size:16px;">
                  We received a request to verify your email address. Click the button below
                  to complete the verification.
                </p>
                <p style="margin:24px 0; text-align:center;">
                  <a href="${confirmLink}" style="display:inline-block; background-color:#0f172a; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:16px;">
                    Confirm Email
                  </a>
                </p>
                <p style="margin:0 0 16px; font-size:12px; color:#64748b;">
                  If the button doesn't work, open the link manually:
                  <a href="${confirmLink}" style="color:#0f172a; text-decoration:underline;">
                    ${confirmLink}
                  </a>
                </p>
                <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
                <p style="margin:0; font-size:12px; color:#64748b;">
                  The link is valid for 1 hour. If you did not request this verification,
                  simply ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
