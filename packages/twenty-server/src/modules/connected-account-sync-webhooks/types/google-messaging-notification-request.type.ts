import { type GooglePubSubPushMessage } from 'src/modules/connected-account-sync-webhooks/types/google-pubsub-push.type';

export type GoogleMessagingNotificationRequest = {
  body: GooglePubSubPushMessage;
  authorizationHeader: string | undefined;
};
