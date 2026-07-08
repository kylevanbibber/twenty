import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useUpdateManyRecords } from '@/object-record/hooks/useUpdateManyRecords';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { selectedRowIdsComponentSelector } from '@/object-record/record-table/states/selectors/selectedRowIdsComponentSelector';
import {
  getMultiEditFieldInputName,
  normalizeMultiEditValue,
} from '@/object-record/record-update-multiple/utils/getMultiEditUpdateInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useLingui } from '@lingui/react/macro';

type UseApplyInlineBulkFieldEditProps = {
  objectNameSingular: string;
  recordTableId: string;
};

// Sets a single field's value across every currently selected row, straight
// from that column's header dropdown (r3-team's mass-status-change pattern).
export const useApplyInlineBulkFieldEdit = ({
  objectNameSingular,
  recordTableId,
}: UseApplyInlineBulkFieldEditProps) => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar } = useSnackBar();

  const selectedRowIds = useAtomComponentSelectorValue(
    selectedRowIdsComponentSelector,
    recordTableId,
  );

  const { updateManyRecords } = useUpdateManyRecords({
    objectNameSingular,
  });

  const applyBulkEdit = async ({
    fieldMetadataItem,
    fieldDefinition,
    value,
  }: {
    fieldMetadataItem: FieldMetadataItem;
    fieldDefinition: FieldDefinition<FieldMetadata>;
    value: any;
  }) => {
    const normalizedValue = normalizeMultiEditValue(value);

    // `undefined` means "no change" — nothing to persist.
    if (normalizedValue === undefined || selectedRowIds.length === 0) {
      return;
    }

    const inputName = getMultiEditFieldInputName({
      fieldMetadataItem,
      fieldDefinition,
    });

    try {
      await updateManyRecords({
        recordIdsToUpdate: selectedRowIds,
        updateOneRecordInput: { [inputName]: normalizedValue },
      });
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : t`Failed to update records. Please try again.`,
      });
    }
  };

  return {
    applyBulkEdit,
    selectedCount: selectedRowIds.length,
  };
};
