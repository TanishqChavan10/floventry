export interface InviteEmailTemplateParams {
  companyName: string;
  invitedEmail: string;
  invitedByName: string;
  role: string;
  invitationLink: string;
}

/**
 * Generates a minimal, professional HTML email template for company invitations
 */
export function generateInviteEmailTemplate(
  params: InviteEmailTemplateParams,
): string {
  const { companyName, invitedEmail, invitedByName, role, invitationLink } =
    params;

  const formattedRole = role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Invitation to join ${companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fafafa;
      color: #111111;
      padding: 40px 20px;
    }

    .wrapper {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-top: 3px solid #e05252;
      padding: 48px 40px;
    }

    .brand {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #e05252;
      margin-bottom: 36px;
    }

    .heading {
      font-size: 22px;
      font-weight: 600;
      color: #111111;
      line-height: 1.3;
      margin-bottom: 20px;
    }

    .body-text {
      font-size: 15px;
      color: #444444;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .meta {
      margin: 28px 0;
      border-top: 1px solid #eeeeee;
      border-bottom: 1px solid #eeeeee;
      padding: 20px 0;
    }

    .meta-row {
      display: flex;
      font-size: 14px;
      margin-bottom: 10px;
      color: #444444;
    }

    .meta-row:last-child {
      margin-bottom: 0;
    }

    .meta-label {
      width: 80px;
      flex-shrink: 0;
      color: #999999;
    }

    .meta-value {
      color: #111111;
      font-weight: 500;
    }

    .cta-button {
      display: inline-block;
      background-color: #e05252;
      color: #ffffff;
      text-decoration: none;
      padding: 13px 28px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
      margin: 28px 0 24px;
    }

    .link-fallback {
      font-size: 13px;
      color: #999999;
      line-height: 1.6;
      margin-bottom: 28px;
      word-break: break-all;
    }

    .link-fallback a {
      color: #e05252;
      text-decoration: none;
    }

    .notice {
      font-size: 13px;
      color: #999999;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .divider {
      border: none;
      border-top: 1px solid #eeeeee;
      margin: 28px 0;
    }

    .footer {
      font-size: 12px;
      color: #bbbbbb;
      line-height: 1.6;
    }

    @media only screen and (max-width: 560px) {
      .wrapper {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand">Floventry</div>

    <h1 class="heading">You've been invited to join ${companyName}</h1>

    <p class="body-text">
      ${invitedByName} has invited you to collaborate on Floventry as <strong>${formattedRole}</strong>.
    </p>

    <div class="meta">
      <div class="meta-row">
        <span class="meta-label">Company</span>
        <span class="meta-value">${companyName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Email</span>
        <span class="meta-value">${invitedEmail}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Role</span>
        <span class="meta-value">${formattedRole}</span>
      </div>
    </div>

    <a href="${invitationLink}" class="cta-button" style="color: #ffffff; text-decoration: none;">Accept invitation</a>

    <p class="link-fallback">
      Or paste this link into your browser:<br>
      <a href="${invitationLink}">${invitationLink}</a>
    </p>

    <hr class="divider">

    <p class="notice">This invitation expires in 48 hours.</p>
    <p class="notice">If you weren't expecting this, you can safely ignore this email.</p>

    <div class="footer">
      <p>Sent to ${invitedEmail} &middot; Floventry</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
