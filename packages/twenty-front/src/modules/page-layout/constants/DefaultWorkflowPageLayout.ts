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
 * Specialized layout for workflow visualization with fields pinned left.
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
  defaultTabToFocusOnMobileAndSidePanelId: 'workflow-tab-flow',
  tabs: [
    // Fields tab (position 100)
    {
      __typename: 'PageLayoutTab',
      applicationId: '',
      id: 'workflow-tab-fields',
      isActive: true,
      title: 'Home',
      position: 100,
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      icon: 'IconHome',
      pageLayoutId: DEFAULT_WORKFLOW_PAGE_LAYOUT_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      widgets: [
        {
          __typename: 'PageLayoutWidget',
          applicationId: '',
          id: 'workflow-widget-fields',
          isActive: true,
          pageLayoutTabId: 'workflow-tab-fields',
          title: 'Fields',
          type: WidgetType.FIELDS,
          objectMetadataId: null,
          gridPosition: {
            __typename: 'GridPosition',
            row: 0,
            column: 0,
            rowSpan: 12,
            columnSpan: 12,
          },
          position: {
            __typename: 'PageLayoutWidgetVerticalListPosition',
            layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
            index: 0,
          },
          configuration: {
            __typename: 'FieldsConfiguration',
            configurationType: WidgetConfigurationType.FIELDS,
            viewId: null,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
    },
    // Flow tab (position 200)
    {
      __typename: 'PageLayoutTab',
      applicationId: '',
      id: 'workflow-tab-flow',
      isActive: true,
      title: 'Flow',
      position: 200,
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
  ],
};
