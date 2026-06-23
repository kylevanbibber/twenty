import { Field, ObjectType } from '@nestjs/graphql';

import { IsIn, IsNotEmpty } from 'class-validator';
import { type WorkflowEmailTemplatesConfiguration } from 'twenty-shared/types';

import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';

@ObjectType('WorkflowEmailTemplatesConfiguration')
export class WorkflowEmailTemplatesConfigurationDTO implements WorkflowEmailTemplatesConfiguration {
  @Field(() => WidgetConfigurationType)
  @IsIn([WidgetConfigurationType.WORKFLOW_EMAIL_TEMPLATES])
  @IsNotEmpty()
  configurationType: WidgetConfigurationType.WORKFLOW_EMAIL_TEMPLATES;
}
