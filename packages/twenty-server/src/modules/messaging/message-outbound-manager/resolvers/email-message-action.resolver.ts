import { Logger, UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { ConnectedAccountMetadataService } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.service';
import { SendEmailOutputDTO } from 'src/modules/messaging/message-outbound-manager/dtos/send-email-output.dto';
import { EmailMessageActionInput } from 'src/modules/messaging/message-outbound-manager/dtos/email-message-action.input';
import { EmailMessageActionService } from 'src/modules/messaging/message-outbound-manager/services/email-message-action.service';

@MetadataResolver()
@UsePipes(ResolverValidationPipe)
@UseFilters(AuthGraphqlApiExceptionFilter)
@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.SEND_EMAIL_TOOL),
)
export class EmailMessageActionResolver {
  private readonly logger = new Logger(EmailMessageActionResolver.name);

  constructor(
    private readonly connectedAccountMetadataService: ConnectedAccountMetadataService,
    private readonly emailMessageActionService: EmailMessageActionService,
  ) {}

  @Mutation(() => SendEmailOutputDTO)
  async emailMessageAction(
    @Args('input') input: EmailMessageActionInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ): Promise<SendEmailOutputDTO> {
    try {
      await this.connectedAccountMetadataService.verifyOwnership({
        id: input.connectedAccountId,
        userWorkspaceId,
        workspaceId: workspace.id,
      });

      await this.emailMessageActionService.execute(input, workspace.id);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to perform email action: ${error}`);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to perform email action',
      };
    }
  }
}
