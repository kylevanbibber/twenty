import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';

import { isFieldMetadataItemFilterableAndSortableSelector } from '@/object-metadata/states/isFieldMetadataItemFilterableAndSortableSelector';
import { isFieldMetadataItemLabelIdentifierSelector } from '@/object-metadata/states/isFieldMetadataItemLabelIdentifierSelector';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { useChangeRecordFieldVisibility } from '@/object-record/record-field/hooks/useChangeRecordFieldVisibility';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { useHandleToggleColumnSort } from '@/object-record/record-index/hooks/useHandleToggleColumnSort';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useMoveTableColumn } from '@/object-record/record-table/hooks/useMoveTableColumn';
import { useOpenRecordFilterChipFromTableHeader } from '@/object-record/record-table/record-table-header/hooks/useOpenRecordFilterChipFromTableHeader';
import { isRecordTableColumnHeadersReadOnlyComponentState } from '@/object-record/record-table/states/isRecordTableColumnHeadersReadOnlyComponentState';
import { selectedRowIdsComponentSelector } from '@/object-record/record-table/states/selectors/selectedRowIdsComponentSelector';
import { InlineBulkEditFieldContent } from '@/object-record/record-update-multiple/components/InlineBulkEditFieldContent';
import { useApplyInlineBulkFieldEdit } from '@/object-record/record-update-multiple/hooks/useApplyInlineBulkFieldEdit';
import { shouldDisplayFormMultiEditField } from '@/object-record/record-update-multiple/utils/shouldDisplayFormMultiEditField';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useToggleScrollWrapper } from '@/ui/utilities/scroll/hooks/useToggleScrollWrapper';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useLingui } from '@lingui/react/macro';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import {
  IconArrowLeft,
  IconArrowRight,
  IconEyeOff,
  IconFilter,
  IconPencil,
  IconSortDescending,
} from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';

export type RecordTableColumnHeadDropdownMenuProps = {
  recordField: RecordField;
  objectMetadataId: string;
};

const StyledDropdownMenuItemsContainerWrapper = styled.div`
  z-index: ${themeCssVariables.lastLayerZIndex};
`;

export const RecordTableColumnHeadDropdownMenu = ({
  recordField,
  objectMetadataId,
}: RecordTableColumnHeadDropdownMenuProps) => {
  const { t } = useLingui();

  const { toggleScrollXWrapper, toggleScrollYWrapper } =
    useToggleScrollWrapper();

  const {
    visibleRecordFields,
    recordTableId,
    objectMetadataItem,
    objectNameSingular,
    objectPermissions,
  } = useRecordTableContextOrThrow();

  const [mode, setMode] = useState<'menu' | 'bulk-edit'>('menu');

  const isLabelIdentifier = useAtomFamilySelectorValue(
    isFieldMetadataItemLabelIdentifierSelector,
    { fieldMetadataItemId: recordField.fieldMetadataItemId },
  );

  const secondVisibleRecordField = visibleRecordFields[1];
  const canMove = isLabelIdentifier !== true;
  const canMoveLeft =
    recordField.fieldMetadataItemId !==
      secondVisibleRecordField?.fieldMetadataItemId && canMove;

  const lastVisibleRecordField =
    visibleRecordFields[visibleRecordFields.length - 1];

  const canMoveRight =
    recordField.fieldMetadataItemId !==
      lastVisibleRecordField?.fieldMetadataItemId && canMove;

  const { moveTableColumn } = useMoveTableColumn({
    recordTableId,
  });

  const { changeRecordFieldVisibility } =
    useChangeRecordFieldVisibility(recordTableId);

  const dropdownId = recordField.fieldMetadataItemId + '-header';

  const { closeDropdown } = useCloseDropdown();

  const closeDropdownAndToggleScroll = () => {
    closeDropdown(dropdownId);
    toggleScrollXWrapper(true);
    toggleScrollYWrapper(false);
  };

  const handleColumnMoveLeft = () => {
    if (!canMoveLeft) return;

    moveTableColumn('left', recordField.fieldMetadataItemId);
  };

  const handleColumnMoveRight = () => {
    if (!canMoveRight) return;

    moveTableColumn('right', recordField.fieldMetadataItemId);
  };

  const handleColumnVisibility = async () => {
    closeDropdownAndToggleScroll();
    await changeRecordFieldVisibility({
      fieldMetadataId: recordField.fieldMetadataItemId,
      isVisible: false,
    });
  };

  const handleToggleColumnSort = useHandleToggleColumnSort({
    objectMetadataItemId: objectMetadataId,
  });

  const handleSortClick = () => {
    closeDropdownAndToggleScroll();

    handleToggleColumnSort(recordField.fieldMetadataItemId);
  };

  const { openRecordFilterChipFromTableHeader } =
    useOpenRecordFilterChipFromTableHeader();

  const handleFilterClick = () => {
    closeDropdownAndToggleScroll();

    openRecordFilterChipFromTableHeader(recordField.fieldMetadataItemId);
  };

  const { isFilterable, isSortable } = useAtomFamilySelectorValue(
    isFieldMetadataItemFilterableAndSortableSelector,
    { fieldMetadataItemId: recordField.fieldMetadataItemId },
  );

  const showSeparator =
    (isFilterable || isSortable) && isLabelIdentifier !== true;
  const canHide = isLabelIdentifier !== true;

  const selectedRowIds = useAtomComponentSelectorValue(
    selectedRowIdsComponentSelector,
    recordTableId,
  );

  const isRecordTableColumnHeadersReadOnly = useAtomComponentStateValue(
    isRecordTableColumnHeadersReadOnlyComponentState,
    recordTableId,
  );

  const fieldMetadataItem = objectMetadataItem.fields.find(
    (field) => field.id === recordField.fieldMetadataItemId,
  );

  const { applyBulkEdit, selectedCount } = useApplyInlineBulkFieldEdit({
    objectNameSingular,
    recordTableId,
  });

  const canBulkEdit =
    selectedRowIds.length > 1 &&
    objectPermissions.canUpdateObjectRecords === true &&
    !isRecordTableColumnHeadersReadOnly &&
    isDefined(fieldMetadataItem) &&
    shouldDisplayFormMultiEditField(fieldMetadataItem);

  const bulkEditFieldDefinition = isDefined(fieldMetadataItem)
    ? formatFieldMetadataItemAsFieldDefinition({
        field: fieldMetadataItem,
        objectMetadataItem,
        showLabel: false,
      })
    : undefined;

  const handleBulkEditClick = () => {
    setMode('bulk-edit');
  };

  const handleBulkEditApply = async (value: unknown) => {
    if (!isDefined(fieldMetadataItem) || !isDefined(bulkEditFieldDefinition)) {
      return;
    }

    closeDropdownAndToggleScroll();

    await applyBulkEdit({
      fieldMetadataItem,
      fieldDefinition: bulkEditFieldDefinition,
      value,
    });
  };

  if (mode === 'bulk-edit' && isDefined(bulkEditFieldDefinition)) {
    return (
      <DropdownContent>
        <StyledDropdownMenuItemsContainerWrapper>
          <InlineBulkEditFieldContent
            fieldDefinition={bulkEditFieldDefinition}
            selectedCount={selectedCount}
            onApply={handleBulkEditApply}
            onCancel={() => setMode('menu')}
          />
        </StyledDropdownMenuItemsContainerWrapper>
      </DropdownContent>
    );
  }

  return (
    <DropdownContent>
      <StyledDropdownMenuItemsContainerWrapper>
        <DropdownMenuItemsContainer>
          {canBulkEdit && (
            <>
              <MenuItem
                LeftIcon={IconPencil}
                onClick={handleBulkEditClick}
                text={t`Set value for ${selectedCount} selected`}
              />
              <DropdownMenuSeparator />
            </>
          )}
          {isFilterable && (
            <MenuItem
              LeftIcon={IconFilter}
              onClick={handleFilterClick}
              text={t`Filter`}
            />
          )}
          {isSortable && (
            <MenuItem
              LeftIcon={IconSortDescending}
              onClick={handleSortClick}
              text={t`Sort`}
            />
          )}
          {showSeparator && <DropdownMenuSeparator />}
          {canMoveLeft && (
            <MenuItem
              LeftIcon={IconArrowLeft}
              onClick={handleColumnMoveLeft}
              text={t`Move left`}
            />
          )}
          {canMoveRight && (
            <MenuItem
              LeftIcon={IconArrowRight}
              onClick={handleColumnMoveRight}
              text={t`Move right`}
            />
          )}
          {canHide && (
            <MenuItem
              LeftIcon={IconEyeOff}
              onClick={async () => await handleColumnVisibility()}
              text={t`Hide`}
            />
          )}
        </DropdownMenuItemsContainer>
      </StyledDropdownMenuItemsContainerWrapper>
    </DropdownContent>
  );
};
