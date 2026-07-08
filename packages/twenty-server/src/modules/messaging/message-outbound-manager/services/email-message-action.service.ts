import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { google } from 'googleapis';
import { In, Repository } from 'typeorm';

import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { MessageFolderEntity } from 'src/engine/metadata-modules/message-folder/entities/message-folder.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import { type MessageChannelMessageAssociationMessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association-message-folder.workspace-entity';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { type EmailMessageActionInput } from 'src/modules/messaging/message-outbound-manager/dtos/email-message-action.input';

@Injectable()
export class EmailMessageActionService {
  constructor(
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    @InjectRepository(MessageChannelEntity)
    private readonly messageChannelRepository: Repository<MessageChannelEntity>,
    @InjectRepository(MessageFolderEntity)
    private readonly messageFolderRepository: Repository<MessageFolderEntity>,
  ) {}

  async execute(input: EmailMessageActionInput, workspaceId: string): Promise<void> {
    const oAuth2Client = await this.googleOAuth2ClientProvider.getClient(
      input.connectedAccountId,
    );

    const gmailClient = google.gmail({
      version: 'v1',
      auth: oAuth2Client,
    });

    if (input.threadExternalId) {
      await this.executeThreadAction(gmailClient, input);
      await this.updateLocalFolderAssociations(input, workspaceId);

      return;
    }

    if (!input.messageExternalId) {
      throw new Error('A message or thread external id is required');
    }

    await this.executeMessageAction(gmailClient, input);
    await this.updateLocalFolderAssociations(input, workspaceId);
  }

  private async updateLocalFolderAssociations(
    input: EmailMessageActionInput,
    workspaceId: string,
  ): Promise<void> {
    const messageChannel = await this.messageChannelRepository.findOne({
      where: { connectedAccountId: input.connectedAccountId },
    });

    if (!messageChannel) {
      return;
    }

    const folders = await this.messageFolderRepository.find({
      where: { messageChannelId: messageChannel.id },
    });

    const folderIdByExternalId = new Map(
      folders
        .filter((folder) => folder.externalId)
        .map((folder) => [folder.externalId, folder.id]),
    );

    const removeFolderIds = ['INBOX', 'SPAM', 'TRASH']
      .map((externalId) => folderIdByExternalId.get(externalId))
      .filter((folderId): folderId is string => !!folderId);

    const inboxFolderId = folderIdByExternalId.get('INBOX');
    const trashFolderId = folderIdByExternalId.get('TRASH');
    const targetFolderId = input.targetLabelId
      ? folderIdByExternalId.get(input.targetLabelId) ?? input.targetLabelId
      : undefined;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const associationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociation',
          );

        const folderAssociationRepository =
          await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationMessageFolderWorkspaceEntity>(
            workspaceId,
            'messageChannelMessageAssociationMessageFolder',
          );

        const associations = await associationRepository.find({
          where: input.threadExternalId
            ? {
                messageChannelId: messageChannel.id,
                messageThreadExternalId: input.threadExternalId,
              }
            : {
                messageChannelId: messageChannel.id,
                messageExternalId: input.messageExternalId ?? null,
              },
        });

        if (associations.length === 0) {
          return;
        }

        const associationIds = associations.map((association) => association.id);

        if (input.action === 'ARCHIVE') {
          if (!inboxFolderId) {
            return;
          }

          await folderAssociationRepository.delete({
            messageChannelMessageAssociationId: In(associationIds),
            messageFolderId: inboxFolderId,
          });

          return;
        }

        if (input.action === 'TRASH' || input.action === 'DELETE') {
          if (removeFolderIds.length > 0) {
            await folderAssociationRepository.delete({
              messageChannelMessageAssociationId: In(associationIds),
              messageFolderId: In(removeFolderIds),
            });
          }

          if (trashFolderId) {
            await this.addLocalFolderAssociations(
              folderAssociationRepository,
              associationIds,
              trashFolderId,
            );
          }

          return;
        }

        if (input.action === 'MOVE' && targetFolderId) {
          if (removeFolderIds.length > 0) {
            await folderAssociationRepository.delete({
              messageChannelMessageAssociationId: In(associationIds),
              messageFolderId: In(removeFolderIds),
            });
          }

          await this.addLocalFolderAssociations(
            folderAssociationRepository,
            associationIds,
            targetFolderId,
          );
        }
      },
      buildSystemAuthContext(workspaceId),
      { lite: true },
    );
  }

  private async addLocalFolderAssociations(
    folderAssociationRepository: WorkspaceRepository<MessageChannelMessageAssociationMessageFolderWorkspaceEntity>,
    associationIds: string[],
    folderId: string,
  ): Promise<void> {
    const existingAssociations = await folderAssociationRepository.find({
      where: {
        messageChannelMessageAssociationId: In(associationIds),
        messageFolderId: folderId,
      },
    });

    const existingAssociationIds = new Set(
      existingAssociations.map(
        (association) => association.messageChannelMessageAssociationId,
      ),
    );

    const recordsToInsert = associationIds
      .filter((associationId) => !existingAssociationIds.has(associationId))
      .map((associationId) => ({
        messageChannelMessageAssociationId: associationId,
        messageFolderId: folderId,
      }));

    if (recordsToInsert.length > 0) {
      await folderAssociationRepository.insert(recordsToInsert);
    }
  }

  private async executeThreadAction(
    gmailClient: ReturnType<typeof google.gmail>,
    input: EmailMessageActionInput,
  ) {
    const threadId = input.threadExternalId;

    if (!threadId) {
      throw new Error('Thread external id is required');
    }

    switch (input.action) {
      case 'ARCHIVE':
        await gmailClient.users.threads.modify({
          userId: 'me',
          id: threadId,
          requestBody: { removeLabelIds: ['INBOX'] },
        });
        return;
      case 'TRASH':
        await gmailClient.users.threads.trash({ userId: 'me', id: threadId });
        return;
      case 'DELETE':
        await gmailClient.users.threads.trash({ userId: 'me', id: threadId });
        return;
      case 'MOVE':
        if (!input.targetLabelId) {
          throw new Error('Target label id is required when moving a thread');
        }

        await gmailClient.users.threads.modify({
          userId: 'me',
          id: threadId,
          requestBody: {
            addLabelIds: [input.targetLabelId],
            removeLabelIds: ['INBOX', 'SPAM', 'TRASH'],
          },
        });
        return;
      default:
        throw new Error(`Unsupported email action ${input.action}`);
    }
  }

  private async executeMessageAction(
    gmailClient: ReturnType<typeof google.gmail>,
    input: EmailMessageActionInput,
  ) {
    const messageId = input.messageExternalId;

    if (!messageId) {
      throw new Error('Message external id is required');
    }

    switch (input.action) {
      case 'ARCHIVE':
        await gmailClient.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: { removeLabelIds: ['INBOX'] },
        });
        return;
      case 'TRASH':
        await gmailClient.users.messages.trash({ userId: 'me', id: messageId });
        return;
      case 'DELETE':
        await gmailClient.users.messages.trash({
          userId: 'me',
          id: messageId,
        });
        return;
      case 'MOVE':
        if (!input.targetLabelId) {
          throw new Error('Target label id is required when moving a message');
        }

        await gmailClient.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: [input.targetLabelId],
            removeLabelIds: ['INBOX', 'SPAM', 'TRASH'],
          },
        });
        return;
      default:
        throw new Error(`Unsupported email action ${input.action}`);
    }
  }
}
