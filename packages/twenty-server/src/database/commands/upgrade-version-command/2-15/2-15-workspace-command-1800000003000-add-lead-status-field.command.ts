import { Command } from 'nest-commander';
import {
  type AllFieldMetadataSettings,
  type FieldMetadataComplexOption,
  type FieldMetadataDefaultValueForAnyType,
  FieldMetadataType,
  ViewType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const LEAD_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '20202020-4de5-4a50-b701-2ae4f4db0001';
const LEAD_VIEW_FIELD_NAMESPACE = '20202020-4de5-4a50-b701-2ae4f4db00ff';

type WorkspaceFlatEntityMaps = Awaited<
  ReturnType<WorkspaceCacheService['getOrRecompute']>
>;
type FlatNavigationMenuItemMaps =
  WorkspaceFlatEntityMaps['flatNavigationMenuItemMaps'];
type FlatObjectMetadataMaps = WorkspaceFlatEntityMaps['flatObjectMetadataMaps'];

const LEAD_WORKFLOW_NAVIGATION_POSITION_BY_OBJECT_NAME = {
  lead: 0,
  workflow: 1,
  dashboard: 2,
} as const satisfies Record<string, number>;

const HIDDEN_NAVIGATION_OBJECT_NAMES = new Set(['task', 'note']);

const LEAD_STATUS_OPTIONS: FieldMetadataComplexOption[] = [
  {
    id: '20202020-5d94-40f2-a15c-ef2952510001',
    value: 'LEAD',
    label: 'Lead',
    position: 0,
    color: 'red',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510002',
    value: 'DRIP',
    label: 'Drip',
    position: 1,
    color: 'purple',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510003',
    value: 'QUOTE',
    label: 'Quote',
    position: 2,
    color: 'sky',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510004',
    value: 'INVOICE',
    label: 'Invoice',
    position: 3,
    color: 'turquoise',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510005',
    value: 'PAID',
    label: 'Paid',
    position: 4,
    color: 'yellow',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510006',
    value: 'SHIPPED',
    label: 'Shipped',
    position: 5,
    color: 'green',
  },
  {
    id: '20202020-5d94-40f2-a15c-ef2952510007',
    value: 'RECEIVED',
    label: 'Received',
    position: 6,
    color: 'blue',
  },
];

type LeadTableFieldConfig = {
  name: string;
  label: string;
  description: string;
  icon: string;
  type: FieldMetadataType;
  universalIdentifier: string;
  isNullable: boolean;
  size: number;
  defaultValue?: FieldMetadataDefaultValueForAnyType;
  isLabelSyncedWithName?: boolean;
  isUnique?: boolean;
  options?: FieldMetadataComplexOption[];
  settings?: AllFieldMetadataSettings;
};

const LEAD_TABLE_FIELD_CONFIGS: LeadTableFieldConfig[] = [
  {
    name: 'name',
    label: 'Name',
    description: "Lead's name",
    icon: 'IconUser',
    type: FieldMetadataType.TEXT,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0002',
    isNullable: true,
    size: 210,
  },
  {
    name: 'email',
    label: 'Email',
    description: "Lead's email",
    icon: 'IconMail',
    type: FieldMetadataType.EMAILS,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0003',
    isNullable: true,
    isUnique: true,
    settings: {
      maxNumberOfValues: 1,
    },
    size: 210,
  },
  {
    name: 'status',
    label: 'Status',
    description: 'Lead outreach status',
    icon: 'IconProgressCheck',
    type: FieldMetadataType.SELECT,
    universalIdentifier: LEAD_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
    defaultValue: "'LEAD'",
    isNullable: false,
    options: LEAD_STATUS_OPTIONS,
    size: 140,
  },
  {
    name: 'company',
    label: 'Company',
    description: "Lead's company",
    icon: 'IconBuildingSkyscraper',
    type: FieldMetadataType.TEXT,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0004',
    isNullable: true,
    size: 180,
  },
  {
    name: 'phone',
    label: 'Phone',
    description: "Lead's phone number",
    icon: 'IconPhone',
    type: FieldMetadataType.PHONES,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0005',
    isNullable: true,
    settings: {
      maxNumberOfValues: 1,
    },
    size: 160,
  },
  {
    name: 'jobTitle',
    label: 'Job Title',
    description: "Lead's job title",
    icon: 'IconBriefcase',
    type: FieldMetadataType.TEXT,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0006',
    isNullable: true,
    size: 180,
  },
  {
    name: 'linkedinLink',
    label: 'Linkedin',
    description: "Lead's Linkedin account",
    icon: 'IconBrandLinkedin',
    type: FieldMetadataType.LINKS,
    universalIdentifier: '20202020-4de5-4a50-b701-2ae4f4db0007',
    isNullable: true,
    isLabelSyncedWithName: false,
    size: 180,
  },
];

const buildLeadField = ({
  fieldConfig,
  leadObjectMetadata,
  workspaceId,
  workspaceCustomApplicationId,
  workspaceCustomApplicationUniversalIdentifier,
  now,
}: {
  fieldConfig: LeadTableFieldConfig;
  leadObjectMetadata: FlatObjectMetadata;
  workspaceId: string;
  workspaceCustomApplicationId: string;
  workspaceCustomApplicationUniversalIdentifier: string;
  now: string;
}): FlatFieldMetadata => ({
  id: uuidv4(),
  universalIdentifier: fieldConfig.universalIdentifier,
  applicationId: workspaceCustomApplicationId,
  workspaceId,
  objectMetadataId: leadObjectMetadata.id,
  objectMetadataUniversalIdentifier: leadObjectMetadata.universalIdentifier,
  type: fieldConfig.type,
  name: fieldConfig.name,
  label: fieldConfig.label,
  defaultValue: fieldConfig.defaultValue ?? null,
  description: fieldConfig.description,
  icon: fieldConfig.icon,
  standardOverrides: null,
  options: fieldConfig.options ?? null,
  settings: fieldConfig.settings ?? null,
  universalSettings: null,
  isActive: true,
  isSystem: false,
  isSystemSideEffect: false,
  isUIEditable: true,
  isNullable: fieldConfig.isNullable,
  isUnique: fieldConfig.isUnique ?? false,
  isLabelSyncedWithName: fieldConfig.isLabelSyncedWithName ?? true,
  relationTargetFieldMetadataId: null,
  relationTargetObjectMetadataId: null,
  morphId: null,
  relationTargetObjectMetadataUniversalIdentifier: null,
  relationTargetFieldMetadataUniversalIdentifier: null,
  viewFieldIds: [],
  viewFieldUniversalIdentifiers: [],
  viewFilterIds: [],
  viewFilterUniversalIdentifiers: [],
  fieldPermissionIds: [],
  fieldPermissionUniversalIdentifiers: [],
  kanbanAggregateOperationViewIds: [],
  kanbanAggregateOperationViewUniversalIdentifiers: [],
  calendarViewIds: [],
  calendarViewUniversalIdentifiers: [],
  mainGroupByFieldMetadataViewIds: [],
  mainGroupByFieldMetadataViewUniversalIdentifiers: [],
  viewSortIds: [],
  viewSortUniversalIdentifiers: [],
  applicationUniversalIdentifier: workspaceCustomApplicationUniversalIdentifier,
  createdAt: now,
  updatedAt: now,
});

const buildLeadViewField = ({
  fieldMetadata,
  fieldConfig,
  tableView,
  position,
  workspaceId,
  workspaceCustomApplicationId,
  workspaceCustomApplicationUniversalIdentifier,
  now,
}: {
  fieldMetadata: FlatFieldMetadata;
  fieldConfig: LeadTableFieldConfig;
  tableView: FlatView;
  position: number;
  workspaceId: string;
  workspaceCustomApplicationId: string;
  workspaceCustomApplicationUniversalIdentifier: string;
  now: string;
}): FlatViewField => {
  return {
    id: uuidv4(),
    universalIdentifier: uuidv5(
      `${tableView.universalIdentifier}:${fieldMetadata.universalIdentifier}`,
      LEAD_VIEW_FIELD_NAMESPACE,
    ),
    applicationId: workspaceCustomApplicationId,
    applicationUniversalIdentifier:
      workspaceCustomApplicationUniversalIdentifier,
    workspaceId,
    viewId: tableView.id,
    viewUniversalIdentifier: tableView.universalIdentifier,
    fieldMetadataId: fieldMetadata.id,
    fieldMetadataUniversalIdentifier: fieldMetadata.universalIdentifier,
    viewFieldGroupId: null,
    viewFieldGroupUniversalIdentifier: null,
    position,
    isVisible: true,
    size: fieldConfig.size,
    aggregateOperation: null,
    isActive: true,
    isSystemSideEffect: false,
    overrides: null,
    universalOverrides: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
};

const buildLeadWorkflowNavigationMenuItemOperations = ({
  flatNavigationMenuItemMaps,
  flatObjectMetadataMaps,
  now,
}: {
  flatNavigationMenuItemMaps: FlatNavigationMenuItemMaps;
  flatObjectMetadataMaps: FlatObjectMetadataMaps;
  now: string;
}): {
  navigationMenuItemsToDelete: FlatNavigationMenuItem[];
  navigationMenuItemsToUpdate: FlatNavigationMenuItem[];
} => {
  const objectNameByUniversalIdentifier = new Map(
    Object.values(flatObjectMetadataMaps.byUniversalIdentifier)
      .filter(isDefined)
      .map((objectMetadata) => [
        objectMetadata.universalIdentifier,
        objectMetadata.nameSingular,
      ]),
  );

  const navigationMenuItemsToDelete: FlatNavigationMenuItem[] = [];
  const navigationMenuItemsToUpdate: FlatNavigationMenuItem[] = [];

  for (const navigationMenuItem of Object.values(
    flatNavigationMenuItemMaps.byUniversalIdentifier,
  ).filter(isDefined)) {
    const targetObjectName = isDefined(
      navigationMenuItem.targetObjectMetadataUniversalIdentifier,
    )
      ? objectNameByUniversalIdentifier.get(
          navigationMenuItem.targetObjectMetadataUniversalIdentifier,
        )
      : undefined;

    if (!isDefined(targetObjectName)) {
      continue;
    }

    if (HIDDEN_NAVIGATION_OBJECT_NAMES.has(targetObjectName)) {
      navigationMenuItemsToDelete.push(navigationMenuItem);

      continue;
    }

    const targetPosition =
      LEAD_WORKFLOW_NAVIGATION_POSITION_BY_OBJECT_NAME[
        targetObjectName as keyof typeof LEAD_WORKFLOW_NAVIGATION_POSITION_BY_OBJECT_NAME
      ];

    if (!isDefined(targetPosition)) {
      continue;
    }

    if (navigationMenuItem.position !== targetPosition) {
      navigationMenuItemsToUpdate.push({
        ...navigationMenuItem,
        position: targetPosition,
        updatedAt: now,
      });
    }
  }

  return {
    navigationMenuItemsToDelete,
    navigationMenuItemsToUpdate,
  };
};

@RegisteredWorkspaceCommand('2.15.0', 1800000003000)
@Command({
  name: 'upgrade:2-15:add-lead-status-field',
  description:
    'Adds people-like fields to the custom Lead object and shows them in Lead table views.',
})
export class AddLeadStatusFieldCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;
    const now = new Date().toISOString();

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatNavigationMenuItemMaps,
      flatViewMaps,
      flatViewFieldMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatNavigationMenuItemMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
    ]);

    const leadObjectMetadata = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .find((objectMetadata) => objectMetadata.nameSingular === 'lead');

    if (!isDefined(leadObjectMetadata)) {
      this.logger.log(`Lead object not found for workspace ${workspaceId}`);

      return;
    }

    const leadFieldMetadatas = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (fieldMetadata) =>
          fieldMetadata.objectMetadataUniversalIdentifier ===
          leadObjectMetadata.universalIdentifier,
      );

    const fieldMetadatasToCreate = LEAD_TABLE_FIELD_CONFIGS.map(
      (fieldConfig) => {
        const existingFieldMetadata = leadFieldMetadatas.find(
          (fieldMetadata) => fieldMetadata.name === fieldConfig.name,
        );

        return isDefined(existingFieldMetadata)
          ? undefined
          : buildLeadField({
              fieldConfig,
              leadObjectMetadata,
              workspaceId,
              workspaceCustomApplicationId: workspaceCustomFlatApplication.id,
              workspaceCustomApplicationUniversalIdentifier:
                workspaceCustomFlatApplication.universalIdentifier,
              now,
            });
      },
    ).filter(isDefined);

    const fieldMetadataByName = new Map(
      [...leadFieldMetadatas, ...fieldMetadatasToCreate].map(
        (fieldMetadata) => [fieldMetadata.name, fieldMetadata],
      ),
    );

    const leadTableViews = Object.values(flatViewMaps.byUniversalIdentifier)
      .filter(isDefined)
      .filter(
        (view) =>
          view.objectMetadataUniversalIdentifier ===
            leadObjectMetadata.universalIdentifier &&
          view.type === ViewType.TABLE,
      );

    const viewFieldsToCreate = leadTableViews.flatMap((tableView) => {
      const existingViewFieldsForView = Object.values(
        flatViewFieldMaps.byUniversalIdentifier,
      )
        .filter(isDefined)
        .filter(
          (viewField) =>
            viewField.viewUniversalIdentifier === tableView.universalIdentifier,
        );

      const existingFieldUniversalIdentifiers = new Set(
        existingViewFieldsForView.map(
          (viewField) => viewField.fieldMetadataUniversalIdentifier,
        ),
      );

      let nextPosition =
        Math.max(
          -1,
          ...existingViewFieldsForView.map((viewField) => viewField.position),
        ) + 1;

      return LEAD_TABLE_FIELD_CONFIGS.map((fieldConfig) => {
        const fieldMetadata = fieldMetadataByName.get(fieldConfig.name);

        if (!isDefined(fieldMetadata)) {
          throw new Error(
            `Could not resolve lead ${fieldConfig.name} field for ${workspaceId}`,
          );
        }

        if (
          existingFieldUniversalIdentifiers.has(
            fieldMetadata.universalIdentifier,
          )
        ) {
          return undefined;
        }

        const viewField = buildLeadViewField({
          fieldMetadata,
          fieldConfig,
          tableView,
          position: nextPosition,
          workspaceId,
          workspaceCustomApplicationId: workspaceCustomFlatApplication.id,
          workspaceCustomApplicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
          now,
        });

        nextPosition += 1;

        return viewField;
      }).filter(isDefined);
    });

    const { navigationMenuItemsToDelete, navigationMenuItemsToUpdate } =
      buildLeadWorkflowNavigationMenuItemOperations({
        flatNavigationMenuItemMaps,
        flatObjectMetadataMaps,
        now,
      });

    const hasChanges =
      fieldMetadatasToCreate.length > 0 ||
      viewFieldsToCreate.length > 0 ||
      navigationMenuItemsToDelete.length > 0 ||
      navigationMenuItemsToUpdate.length > 0;

    if (!hasChanges) {
      this.logger.log(
        `Lead table fields, columns, and sidebar order already exist for workspace ${workspaceId}`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Adding ${fieldMetadatasToCreate.length} lead field(s), ${viewFieldsToCreate.length} table column(s), deleting ${navigationMenuItemsToDelete.length} sidebar item(s), and reordering ${navigationMenuItemsToUpdate.length} sidebar item(s) for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: fieldMetadatasToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            viewField: {
              flatEntityToCreate: viewFieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            navigationMenuItem: {
              flatEntityToCreate: [],
              flatEntityToDelete: navigationMenuItemsToDelete,
              flatEntityToUpdate: navigationMenuItemsToUpdate,
            },
          },
          workspaceId,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
        },
      );

    if (result.status === 'fail') {
      this.logger.error(
        `Failed to add lead table fields for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to add lead table fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Added lead table fields/columns and normalized sidebar order for workspace ${workspaceId}`,
    );
  }
}
