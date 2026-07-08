import { SmtpDriver } from 'src/engine/core-modules/email/drivers/smtp.driver';

const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

describe('SmtpDriver', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it('should resolve after sending an email', async () => {
    sendMailMock.mockResolvedValue(undefined);

    const driver = new SmtpDriver({ host: 'smtp.example.com', port: 587 });

    await expect(
      driver.send({ to: 'recipient@example.com' }),
    ).resolves.toBeUndefined();

    expect(sendMailMock).toHaveBeenCalledWith({
      to: 'recipient@example.com',
    });
  });

  it('should reject when sending an email fails', async () => {
    const error = new Error('SMTP failed');

    sendMailMock.mockRejectedValue(error);

    const driver = new SmtpDriver({ host: 'smtp.example.com', port: 587 });

    await expect(driver.send({ to: 'recipient@example.com' })).rejects.toThrow(
      'SMTP failed',
    );
  });
});
