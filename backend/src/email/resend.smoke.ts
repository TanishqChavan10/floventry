import 'dotenv/config';

import { EmailService } from './email.service';

function usage(): never {
  // Keep output minimal; do not print env values.
  console.log(
    [
      'Usage:',
      '  pnpm -C backend email:smoke -- <toEmail> [token]',
      '',
      'Env required:',
      '  RESEND_API_KEY, RESEND_FROM (or EMAIL_FROM)',
      'Optional:',
      '  FRONTEND_URL (defaults to http://localhost:3000)',
    ].join('\n'),
  );
  process.exit(1);
}

async function main() {
  const [, , toEmail, tokenArg] = process.argv;
  if (!toEmail) usage();

  const token = tokenArg || 'local_smoke_token';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invitationLink = `${frontendUrl}/invite/accept?token=${token}`;

  const emailService = new EmailService();

  await emailService.sendInviteEmail({
    to: toEmail,
    companyName: 'Flowventory (Local)',
    invitedByName: 'Local Dev',
    role: 'STAFF',
    invitationLink,
  });

  console.log(`Sent invite email to ${toEmail}`);
  console.log(`Invitation link: ${invitationLink}`);
}

main().catch((err) => {
  console.error('Smoke email failed:', err);
  process.exit(1);
});
