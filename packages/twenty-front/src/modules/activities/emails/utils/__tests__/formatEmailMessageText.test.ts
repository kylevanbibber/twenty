import { formatEmailMessageText } from '@/activities/emails/utils/formatEmailMessageText';

describe('formatEmailMessageText', () => {
  it('preserves existing email line breaks', () => {
    expect(formatEmailMessageText('Hi,\n\nThanks,\nJane')).toBe(
      'Hi,\n\nThanks,\nJane',
    );
  });

  it('removes image placeholders and formats flattened signatures', () => {
    const body =
      'Good morning, Dyrell! I have attached our catalog. Here is how the process will work like this: 1.) Nap101 submits a PO 2.) R3 sends Nap101 an invoice Best regards, [image: R3 Logo] [image: LinkedIn] Conor Markins Founder/CEO 7901 4th St N Suite 31812 Saint Petersburg, FL 33702 📞 740-961-5890 ✉️ conor@rthree.io 🌐 www.rthree.io Book a meeting with me';

    expect(formatEmailMessageText(body)).toBe(`Good morning, Dyrell! I have attached our catalog. Here is how the process will work like this:
1.) Nap101 submits a PO
2.) R3 sends Nap101 an invoice

Best regards,
Conor Markins
Founder/CEO 7901 4th St N Suite 31812 Saint Petersburg, FL 33702
📞 740-961-5890
✉️ conor@rthree.io
🌐 www.rthree.io
Book a meeting with me`);
  });

  it('converts basic html separators before formatting text', () => {
    expect(formatEmailMessageText('<p>Hello</p><p>Regards,</p><p>Jane</p>'))
      .toBe(`Hello

Regards,
Jane`);
  });
});
