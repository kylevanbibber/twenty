import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

import { EMAIL_MESSAGE_ACTION } from '@/activities/emails/graphql/mutations/emailMessageAction';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';

type EmailMessageAction = 'ARCHIVE' | 'TRASH' | 'DELETE' | 'MOVE';

type EmailMessageActionParams = {
  connectedAccountId: string;
  messageExternalId?: string | null;
  threadExternalId?: string | null;
  action: EmailMessageAction;
  targetLabelId?: string;
};

type EmailMessageActionMutationResult = {
  emailMessageAction?: {
    success: boolean;
    error?: string | null;
  } | null;
};

type EmailMessageActionMutationVariables = {
  input: EmailMessageActionParams;
};

export const useEmailMessageAction = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const [emailMessageActionMutation, { loading }] = useMutation<
    EmailMessageActionMutationResult,
    EmailMessageActionMutationVariables
  >(EMAIL_MESSAGE_ACTION);

  const runEmailMessageAction = useCallback(
    async (params: EmailMessageActionParams) => {
      try {
        const result = await emailMessageActionMutation({
          variables: { input: params },
        });

        if (result.data?.emailMessageAction?.success) {
          enqueueSuccessSnackBar({ message: t`Email updated` });

          await apolloCoreClient.refetchQueries({
            include: [
              'FindManyMessages',
              'FindManyMessageParticipants',
              'FindManyMessageChannelMessageAssociations',
            ],
          });

          return true;
        }

        enqueueErrorSnackBar({
          message:
            result.data?.emailMessageAction?.error ?? t`Failed to update email`,
        });

        return false;
      } catch {
        enqueueErrorSnackBar({ message: t`Failed to update email` });

        return false;
      }
    },
    [
      apolloCoreClient,
      emailMessageActionMutation,
      enqueueErrorSnackBar,
      enqueueSuccessSnackBar,
    ],
  );

  return { runEmailMessageAction, loading };
};
