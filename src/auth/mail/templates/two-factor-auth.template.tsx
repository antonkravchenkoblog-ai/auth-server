interface TwoFactorAuthTemplateProps {
	token: string;
}

export function TwoFactorAuthTemplate({ token }: TwoFactorAuthTemplateProps) {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Two-Factor Authentication</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; padding:32px; box-shadow:0 8px 24px rgba(15, 23, 42, 0.08);">
            <tr>
              <td style="font-family:Arial, sans-serif;">
                <h1 style="margin:0 0 8px; font-size:24px;">Two-Factor Authentication</h1>
                <p style="margin:0 0 12px; color:#475569; font-size:14px;">Hello!</p>
                <p style="margin:0 0 20px; font-size:16px;">
                  Use the code below to complete your sign-in. The code is valid for a few minutes.
                </p>
                <div style="margin:24px 0; background:#f1f5f9; border-radius:12px; padding:16px; text-align:center;">
                  <span style="font-family:Courier, monospace; font-size:24px; letter-spacing:6px; color:#0f172a;">${token}</span>
                </div>
                <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
                <p style="margin:0; font-size:12px; color:#64748b;">
                  If you did not request this code, simply ignore this email.
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