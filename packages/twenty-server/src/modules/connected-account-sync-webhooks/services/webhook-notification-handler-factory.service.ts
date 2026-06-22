import { Injectable } from '@nestjs/common';

import {
  type ConnectedAccountProvider,
  type WebhookSubscriptionChannelType,
} from 'twenty-shared/types';

import {
  ConnectedAccountSyncWebhookException,
  ConnectedAccountSyncWebhookExceptionCode,
} from 'src/modules/connected-account-sync-webhooks/connected-account-sync-webhook.exception';
import { GoogleCalendarNotificationHandler } from 'src/modules/connected-account-sync-webhooks/handlers/google-calendar-notification.handler';
import { GoogleMessagingNotificationHandler } from 'src/modules/connected-account-sync-webhooks/handlers/google-messaging-notification.handler';
import { MicrosoftCalendarNotificationHandler } from 'src/modules/connected-account-sync-webhooks/handlers/microsoft-calendar-notification.handler';
import { MicrosoftMessagingNotificationHandler } from 'src/modules/connected-account-sync-webhooks/handlers/microsoft-messaging-notification.handler';
import {
  type WebhookNotificationHandler,
  type WebhookNotificationHandlerKey,
  type WebhookNotificationRequestByHandler,
} from 'src/modules/connected-account-sync-webhooks/types/webhook-notification-handler.type';

type WebhookNotificationHandlerRegistry = {
  [TKey in WebhookNotificationHandlerKey]: WebhookNotificationHandler<
    WebhookNotificationRequestByHandler[TKey]
  >;
};

@Injectable()
export class WebhookNotificationHandlerFactory {
  private readonly handlersByKey: WebhookNotificationHandlerRegistry;

  constructor(
    private readonly googleMessagingNotificationHandler: GoogleMessagingNotificationHandler,
    private readonly googleCalendarNotificationHandler: GoogleCalendarNotificationHandler,
    private readonly microsoftMessagingNotificationHandler: MicrosoftMessagingNotificationHandler,
    private readonly microsoftCalendarNotificationHandler: MicrosoftCalendarNotificationHandler,
  ) {
    this.handlersByKey = {
      'google:messaging': this.googleMessagingNotificationHandler,
      'google:calendar': this.googleCalendarNotificationHandler,
      'microsoft:messaging': this.microsoftMessagingNotificationHandler,
      'microsoft:calendar': this.microsoftCalendarNotificationHandler,
    };
  }

  getHandler<TKey extends WebhookNotificationHandlerKey>(
    provider: ConnectedAccountProvider,
    channelType: WebhookSubscriptionChannelType,
  ): WebhookNotificationHandler<WebhookNotificationRequestByHandler[TKey]> {
    const key = `${provider}:${channelType}` as TKey;
    const handler = this.handlersByKey[key];

    if (!handler) {
      throw new ConnectedAccountSyncWebhookException(
        `No webhook notification handler registered for ${key}`,
        ConnectedAccountSyncWebhookExceptionCode.UNSUPPORTED_NOTIFICATION_HANDLER,
      );
    }

    return handler;
  }
}
