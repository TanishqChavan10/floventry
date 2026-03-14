import { EmailService } from './email.service';

const sendMock = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    })),
  };
});

describe('EmailService (Resend)', () => {
  beforeEach(() => {
    sendMock.mockReset();

    process.env.RESEND_API_KEY = 'test_key';
    process.env.RESEND_FROM = 'Flowventory <support@floventry.online>';
  });

  it('sends invite email containing the tokenized invitation link', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    const service = new EmailService();

    const token = 'tok_abc123';
    const invitationLink = `http://localhost:3000/invite/accept?token=${token}`;

    await service.sendInviteEmail({
      to: 'test@example.com',
      companyName: 'Acme Inc',
      invitedByName: 'Jane Doe',
      role: 'STAFF',
      invitationLink,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('test@example.com');
    expect(payload.subject).toContain('Acme Inc');

    expect(payload.html).toContain(invitationLink);
    expect(payload.text).toContain(invitationLink);
    expect(payload.html).toContain(token);
    expect(payload.text).toContain(token);
  });

  it('skips sending when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;

    const service = new EmailService();

    await service.sendEmail('test@example.com', 'Hi', 'hello');

    expect(sendMock).not.toHaveBeenCalled();
  });
});
