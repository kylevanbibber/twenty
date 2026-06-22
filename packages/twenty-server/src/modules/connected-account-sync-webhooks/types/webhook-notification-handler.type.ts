import { type GoogleCalendarChannelNotification } from 'src/modules/connected-account-sync-webhooks/types/google-calendar-notification.type';
import { type GoogleMessagingNotificationRequest } from 'src/modules/connected-account-sync-webhooks/types/google-messaging-notification-request.type';
import { type MicrosoftGraphNotification } from 'src/modules/connected-account-sync-webhooks/types/microsoft-graph-notification.type';

export type WebhookNotificationHandler<TRequest> = {
  handle(request: TRequest): Promise<void>;
};

export type WebhookNotificationRequestByHandler = {
  'google:messaging': GoogleMessagingNotificationRequest;
  'google:calendar': GoogleCalendarChannelNotification;
  'microsoft:messaging': MicrosoftGraphNotification[];
  'microsoft:calendar': MicrosoftGraphNotification[];
};

export type WebhookNotificationHandlerKey =
  keyof WebhookNotificationRequestByHandler;
