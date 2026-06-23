import { DEFAULT_WORKFLOW_PAGE_LAYOUT_ID } from '@/page-layout/constants/DefaultWorkflowPageLayoutId';
import { type PageLayout } from '@/page-layout/types/PageLayout';
import {
  PageLayoutTabLayoutMode,
  PageLayoutType,
  WidgetConfigurationType,
  WidgetType,
} from '~/generated-metadata/graphql';

/**
 * Default Workflow PageLayout.
 * Specialized layout for workflow visualization and email template editing.
 */
export const DEFAULT_WORKFLOW_PAGE_LAYOUT: PageLayout = {
  __typename: 'PageLayout',
  id: DEFAULT_WORKFLOW_PAGE_LAYOUT_ID,
  name: 'Default Workflow Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectMetadataId: null,
  universalIdentifier: '00000000-0000-0000-0000-000000000000',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  tabs: [
    // Flow tab (position 100)
    {
      __typename: 'PageLayoutTab',
      applicationId: '',
      id: 'workflow-tab-flow',
      isActive: true,
      title: 'Flow',
      position: 100,
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      icon: 'IconSettings',
      pageLayoutId: DEFAULT_WORKFLOW_PAGE_LAYOUT_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      widgets: [
        {
          __typename: 'PageLayoutWidget',
          applicationId: '',
          id: 'workflow-widget-flow',
          isActive: true,
          pageLayoutTabId: 'workflow-tab-flow',
          title: 'Flow',
          type: WidgetType.WORKFLOW,
          objectMetadataId: null,
          gridPosition: {
            __typename: 'GridPosition',
            row: 0,
            column: 0,
            rowSpan: 12,
            columnSpan: 12,
          },
          position: {
            __typename: 'PageLayoutWidgetCanvasPosition',
            layoutMode: PageLayoutTabLayoutMode.CANVAS,
          },
          configuration: {
            __typename: 'WorkflowConfiguration',
            configurationType: WidgetConfigurationType.WORKFLOW,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
    },
    {
      __typename: 'PageLayoutTab',
      applicationId: '',
      id: 'workflow-tab-email-templates',
      isActive: true,
      title: 'Email Templates',
      position: 200,
      layoutMode: PageLayoutTabLayoutMode.CANVAS,
      icon: 'IconMail',
      pageLayoutId: DEFAULT_WORKFLOW_PAGE_LAYOUT_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      widgets: [
        {
          __typename: 'PageLayoutWidget',
          applicationId: '',
          id: 'workflow-widget-email-templates',
          isActive: true,
          pageLayoutTabId: 'workflow-tab-email-templates',
          title: 'Email Templates',
          type: WidgetType.WORKFLOW_EMAIL_TEMPLATES,
          objectMetadataId: null,
          gridPosition: {
            __typename: 'GridPosition',
            row: 0,
            column: 0,
            rowSpan: 12,
            columnSpan: 12,
          },
          position: {
            __typename: 'PageLayoutWidgetCanvasPosition',
            layoutMode: PageLayoutTabLayoutMode.CANVAS,
          },
          configuration: {
            __typename: 'WorkflowEmailTemplatesConfiguration',
            configurationType: WidgetConfigurationType.WORKFLOW_EMAIL_TEMPLATES,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
    },
  ],
};
