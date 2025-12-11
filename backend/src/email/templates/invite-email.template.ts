export interface InviteEmailTemplateParams {
  companyName: string;
  invitedEmail: string;
  invitedByName: string;
  role: string;
  invitationLink: string;
}

/**
 * Generates a modern, responsive HTML email template for company invitations
 */
export function generateInviteEmailTemplate(
  params: InviteEmailTemplateParams,
): string {
  const { companyName, invitedEmail, invitedByName, role, invitationLink } = params;

  // Format role to be more readable (e.g., warehouse_staff -> Warehouse Staff)
  const formattedRole = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f5;
      padding: 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .email-header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .email-header p {
      color: #e0e7ff;
      font-size: 16px;
    }
    
    .email-body {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .invitation-box {
      background-color: #f9fafb;
      border-left: 4px solid #6366f1;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    
    .invitation-box p {
      margin: 8px 0;
      color: #4b5563;
      font-size: 15px;
    }
    
    .invitation-box strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .role-badge {
      display: inline-block;
      background-color: #6366f1;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    
    .info-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px 0;
    }
    
    .expiry-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 25px 0;
      border-radius: 8px;
    }
    
    .expiry-notice p {
      color: #92400e;
      font-size: 14px;
      margin: 0;
    }
    
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .email-footer p {
      color: #6b7280;
      font-size: 13px;
      margin: 8px 0;
    }
    
    .email-footer a {
      color: #6366f1;
      text-decoration: none;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }
      
      .email-header {
        padding: 30px 20px;
      }
      
      .email-header h1 {
        font-size: 24px;
      }
      
      .cta-button {
        padding: 14px 32px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>🎉 You're Invited!</h1>
      <p>Join your team on Flowventory</p>
    </div>
    
    <!-- Body -->
    <div class="email-body">
      <p class="greeting">Hello,</p>
      
      <p class="info-text">
        <strong>${invitedByName}</strong> has invited you to join their team on Flowventory, the modern inventory management platform.
      </p>
      
      <!-- Invitation Details -->
      <div class="invitation-box">
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Email:</strong> ${invitedEmail}</p>
        <p><strong>Role:</strong> <span class="role-badge">${formattedRole}</span></p>
      </div>
      
      <p class="info-text">
        Click the button below to accept the invitation and start collaborating with your team:
      </p>
      
      <!-- CTA Button -->
      <div class="button-container">
        <a href="${invitationLink}" class="cta-button">Accept Invitation</a>
      </div>
      
      <p class="info-text" style="text-align: center; font-size: 13px; color: #9ca3af;">
        Or copy and paste this link into your browser:<br>
        <a href="${invitationLink}" style="color: #6366f1; word-break: break-all;">${invitationLink}</a>
      </p>
      
      <!-- Expiry Notice -->
      <div class="expiry-notice">
        <p><strong>⏰ This invitation expires in 48 hours.</strong> Please accept it soon to join the team.</p>
      </div>
      
      <div class="divider"></div>
      
      <p class="info-text">
        If you don't recognize this invitation or didn't expect it, you can safely ignore this email. No account will be created unless you click the acceptance button.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <p><strong>Flowventory</strong> - Modern Inventory Management</p>
      <p>This email was sent to ${invitedEmail}</p>
      <p>
        Need help? <a href="mailto:support@flowventory.com">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
