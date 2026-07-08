import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { type gmail_v1 as gmailV1, google } from 'googleapis';
import { isDefined } from 'twenty-shared/utils';

import { MessageFolderImportPolicy } from 'twenty-shared/types';
import { type MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { GmailMessagesImportErrorHandler } from 'src/modules/messaging/message-import-manager/drivers/gmail/services/gmail-messages-import-error-handler.service';
import { filterGmailMessagesByFolderPolicy } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/filter-gmail-messages-by-folder-policy.util';
import { parseAndFormatGmailMessage } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/parse-and-format-gmail-message.util';
import { type MessageWithParticipants } from 'src/modules/messaging/message-import-manager/types/message';

@Injectable()
export class GmailGetMessagesService {
  private readonly logger = new Logger(GmailGetMessagesService.name);

  constructor(
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly gmailMessagesImportErrorHandler: GmailMessagesImportErrorHandler,
  ) {}

  async getMessages(
    messageIds: string[],
    connectedAccount: Pick<
      ConnectedAccountEntity,
      'provider' | 'id' | 'handle' | 'handleAliases'
    >,
    messageChannel: Pick<
      MessageChannelEntity,
      'messageFolders' | 'messageFolderImportPolicy'
    >,
  ): Promise<MessageWithParticipants[]> {
    const oAuth2Client = await this.googleOAuth2ClientProvider.getClient(
      connectedAccount.id,
    );

    const gmailClient = google.gmail({
      version: 'v1',
      auth: oAuth2Client,
    });

    const fetchedMessages = await this.fetchMessages(
      gmailClient,
      messageIds,
      connectedAccount,
    );

    const filteredMessages = filterGmailMessagesByFolderPolicy(
      fetchedMessages,
      messageChannel,
    );

    if (
      messageChannel.messageFolderImportPolicy !==
      MessageFolderImportPolicy.SELECTED_FOLDERS
    ) {
      return filteredMessages;
    }

    const syncedLabelIds = (messageChannel.messageFolders ?? [])
      .filter(
        (folder) => folder.isSynced && isNonEmptyString(folder.externalId),
      )
      .map((folder) => folder.externalId as string);

    if (syncedLabelIds.length === 0) {
      return filteredMessages;
    }

    const fetchedMessageIds = new Set(
      fetchedMessages.map((message) => message.externalId),
    );
    const filteredMessageIds = new Set(
      filteredMessages.map((message) => message.externalId),
    );
    const excludedMessageIds = new Set(
      fetchedMessages
        .filter((message) => !filteredMessageIds.has(message.externalId))
        .map((message) => message.externalId),
    );

    const threadIds = [
      ...new Set(
        fetchedMessages
          .map((message) => message.messageThreadExternalId)
          .filter(isNonEmptyString),
      ),
    ];

    const matchingThreadIds = new Set<string>();
    const missingMessageIds: string[] = [];

    await Promise.all(
      threadIds.map((threadId) =>
        gmailClient.users.threads
          .get({
            userId: 'me',
            id: threadId,
            format: 'metadata',
            metadataHeaders: [],
          })
          .then((response) => {
            const threadMessages = response.data.messages ?? [];

            const threadHasSyncedLabel = threadMessages.some(
              (threadMessage) =>
                !excludedMessageIds.has(threadMessage.id ?? '') &&
                (threadMessage.labelIds ?? []).some((labelId) =>
                  syncedLabelIds.includes(labelId),
                ),
            );

            if (!threadHasSyncedLabel) {
              return;
            }

            matchingThreadIds.add(threadId);

            for (const threadMessage of threadMessages) {
              if (
                isNonEmptyString(threadMessage.id) &&
                !fetchedMessageIds.has(threadMessage.id)
              ) {
                missingMessageIds.push(threadMessage.id);
              }
            }
          })
          .catch((error) => {
            this.gmailMessagesImportErrorHandler.handleError(error, threadId);
          }),
      ),
    );

    const threadSiblings =
      missingMessageIds.length > 0
        ? await this.fetchMessages(
            gmailClient,
            missingMessageIds,
            connectedAccount,
          )
        : [];

    const includedMessages = fetchedMessages.filter(
      (message) =>
        filteredMessageIds.has(message.externalId) ||
        matchingThreadIds.has(message.messageThreadExternalId),
    );

    return [...includedMessages, ...threadSiblings];
  }

  private async fetchMessages(
    gmailClient: gmailV1.Gmail,
    messageIds: string[],
    connectedAccount: Pick<ConnectedAccountEntity, 'handle' | 'handleAliases'>,
  ): Promise<MessageWithParticipants[]> {
    const results = await Promise.all(
      messageIds.map((messageId) =>
        gmailClient.users.messages
          .get({ userId: 'me', id: messageId })
          .then((response) => ({ messageId, data: response.data, error: null }))
          .catch((error) => ({ messageId, data: null, error })),
      ),
    );

    return results
      .map(({ messageId, data, error }) => {
        if (error) {
          if (this.isSkippableMessageFetchError(error)) {
            this.logger.warn(
              `Gmail: Skipping message ${messageId} after transient fetch failure: ${error instanceof Error ? error.message : String(error)}`,
            );

            return undefined;
          }

          this.gmailMessagesImportErrorHandler.handleError(error, messageId);

          return undefined;
        }

        return parseAndFormatGmailMessage(
          data as gmailV1.Schema$Message,
          connectedAccount,
        );
      })
      .filter(isDefined);
  }

  private isSkippableMessageFetchError(error: unknown): boolean {
    if (error === null || typeof error !== 'object') {
      return false;
    }

    const code = 'code' in error ? error.code : undefined;
    const message = 'message' in error ? error.message : undefined;

    return (
      code === 'ERR_STREAM_PREMATURE_CLOSE' ||
      (typeof message === 'string' && message.includes('Premature close'))
    );
  }
}
