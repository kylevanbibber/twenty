import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

export const computeStandardOpportunityViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {
    byStageLead: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'lead',
        isVisible: true,
        fieldValue: 'LEAD',
        position: 0,
      },
    }),
    byStageDrip: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'drip',
        isVisible: true,
        fieldValue: 'DRIP',
        position: 1,
      },
    }),
    byStageQuote: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'quote',
        isVisible: true,
        fieldValue: 'QUOTE',
        position: 2,
      },
    }),
    byStageInvoice: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'invoice',
        isVisible: true,
        fieldValue: 'INVOICE',
        position: 3,
      },
    }),
    byStagePaid: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'paid',
        isVisible: true,
        fieldValue: 'PAID',
        position: 4,
      },
    }),
    byStageShipped: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'shipped',
        isVisible: true,
        fieldValue: 'SHIPPED',
        position: 5,
      },
    }),
    byStageReceived: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'received',
        isVisible: true,
        fieldValue: 'RECEIVED',
        position: 6,
      },
    }),
  };
};
