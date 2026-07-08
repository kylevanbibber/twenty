import { useCallback, useMemo, useState } from 'react';
import { MAX_EMAIL_RECIPIENTS } from 'twenty-shared/constants';
import { type EmailAttachment } from 'twenty-shared/types';

import { useSendEmail } from '@/activities/emails/hooks/useSendEmail';

type UseEmailComposerStateArgs = {
  connectedAccountId: string;
  defaultTo?: string;
  defaultCc?: string;
  defaultSubject?: string;
  defaultBody?: string;
  defaultInReplyTo?: string;
  onSent?: () => void;
};

const countRecipients = (csv: string): number =>
  csv
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0).length;

export const useEmailComposerState = ({
  connectedAccountId: initialConnectedAccountId,
  defaultTo = '',
  defaultCc = '',
  defaultSubject = '',
  defaultBody = '',
  defaultInReplyTo,
  onSent,
}: UseEmailComposerStateArgs) => {
  const [connectedAccountId, setConnectedAccountId] = useState(
    initialConnectedAccountId,
  );
  const [to, setTo] = useState(defaultTo);
  const [toFieldVersion, setToFieldVersion] = useState(0);
  const [cc, setCc] = useState(defaultCc);
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [bodyFieldVersion, setBodyFieldVersion] = useState(0);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [files, setFiles] = useState<EmailAttachment[]>([]);

  const { sendEmail, loading } = useSendEmail();

  const recipientCount = useMemo(
    () => countRecipients(to) + countRecipients(cc) + countRecipients(bcc),
    [to, cc, bcc],
  );

  const exceedsRecipientLimit = recipientCount > MAX_EMAIL_RECIPIENTS;

  const canSend =
    to.trim().length > 0 &&
    connectedAccountId.length > 0 &&
    !loading &&
    !exceedsRecipientLimit;

  const handleSend = useCallback(async () => {
    if (!to.trim() || !connectedAccountId || exceedsRecipientLimit) {
      return;
    }

    const trimmedTo = to.trim();
    const trimmedCc = cc.trim();
    const trimmedBcc = bcc.trim();

    const success = await sendEmail({
      connectedAccountId,
      to: trimmedTo,
      cc: trimmedCc || undefined,
      bcc: trimmedBcc || undefined,
      subject,
      body,
      inReplyTo: defaultInReplyTo,
      files: files.length > 0 ? files : undefined,
    });

    if (success) {
      onSent?.();
    }
  }, [
    connectedAccountId,
    to,
    cc,
    bcc,
    subject,
    body,
    defaultInReplyTo,
    files,
    sendEmail,
    onSent,
    exceedsRecipientLimit,
  ]);

  const appendToRecipient = useCallback((email: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    setTo((currentTo) => {
      const currentRecipients = currentTo
        .split(',')
        .map((recipient) => recipient.trim())
        .filter((recipient) => recipient.length > 0);

      const hasRecipient = currentRecipients.some(
        (recipient) => recipient.toLowerCase() === trimmedEmail.toLowerCase(),
      );

      if (hasRecipient) {
        return currentTo;
      }

      return [...currentRecipients, trimmedEmail].join(', ');
    });

    setToFieldVersion((currentVersion) => currentVersion + 1);
  }, []);

  const completeToRecipient = useCallback((email: string) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    setTo((currentTo) => {
      const currentRecipients = currentTo
        .split(',')
        .map((recipient) => recipient.trim())
        .filter((recipient) => recipient.length > 0);
      const currentDraft =
        currentTo.endsWith(',') || currentRecipients.length === 0
          ? ''
          : currentRecipients[currentRecipients.length - 1];
      const recipientsWithoutDraft =
        currentDraft.length > 0
          ? currentRecipients.slice(0, -1)
          : currentRecipients;
      const dedupedRecipients = recipientsWithoutDraft.filter(
        (recipient) => recipient.toLowerCase() !== trimmedEmail.toLowerCase(),
      );

      return [...dedupedRecipients, trimmedEmail].join(', ');
    });

    setToFieldVersion((currentVersion) => currentVersion + 1);
  }, []);

  const applyDraftTemplate = useCallback(
    ({ subject, body }: { subject: string; body: string }) => {
      setSubject(subject);
      setBody(body);
      setBodyFieldVersion((currentVersion) => currentVersion + 1);
    },
    [],
  );

  return {
    connectedAccountId,
    setConnectedAccountId,
    to,
    setTo,
    appendToRecipient,
    completeToRecipient,
    toFieldVersion,
    cc,
    setCc,
    bcc,
    setBcc,
    subject,
    setSubject,
    body,
    setBody,
    bodyFieldVersion,
    applyDraftTemplate,
    showCcBcc,
    setShowCcBcc,
    files,
    setFiles,
    handleSend,
    loading,
    canSend,
    defaultTo,
    defaultCc,
    defaultSubject,
    defaultBody,
    recipientCount,
    exceedsRecipientLimit,
    maxRecipients: MAX_EMAIL_RECIPIENTS,
  };
};
