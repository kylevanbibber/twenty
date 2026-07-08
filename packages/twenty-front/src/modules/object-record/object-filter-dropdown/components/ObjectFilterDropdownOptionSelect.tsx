import { useEffect, useMemo, useState } from 'react';
import { Key } from 'ts-key-enum';

import { fieldMetadataItemByIdSelector } from '@/object-metadata/states/fieldMetadataItemByIdSelector';
import { type FieldMetadataItemOption } from '@/object-metadata/types/FieldMetadataItem';
import { useOptionsForSelect } from '@/object-record/object-filter-dropdown/hooks/useOptionsForSelect';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';

import { useSelectableList } from '@/ui/layout/selectable-list/hooks/useSelectableList';

import { useApplyObjectFilterDropdownFilterValue } from '@/object-record/object-filter-dropdown/hooks/useApplyObjectFilterDropdownFilterValue';
import { ObjectFilterDropdownComponentInstanceContext } from '@/object-record/object-filter-dropdown/states/contexts/ObjectFilterDropdownComponentInstanceContext';
import { fieldMetadataItemUsedInDropdownComponentSelector } from '@/object-record/object-filter-dropdown/states/fieldMetadataItemUsedInDropdownComponentSelector';
import { objectFilterDropdownCurrentRecordFilterComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownCurrentRecordFilterComponentState';
import { objectFilterDropdownSearchInputComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownSearchInputComponentState';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { selectedItemIdComponentState } from '@/ui/layout/selectable-list/states/selectedItemIdComponentState';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { MAX_OPTIONS_TO_DISPLAY } from 'twenty-shared/constants';
import { isDefined, parseJson } from 'twenty-shared/utils';
import { MenuItem, MenuItemMultiSelect } from 'twenty-ui/navigation';
import { z } from 'zod';

export const EMPTY_FILTER_VALUE = '';

type SelectOptionForFilter = FieldMetadataItemOption & {
  isSelected: boolean;
};

export const ObjectFilterDropdownOptionSelect = ({
  focusId,
}: {
  focusId: string;
}) => {
  const fieldMetadataItemUsedInDropdown = useAtomComponentSelectorValue(
    fieldMetadataItemUsedInDropdownComponentSelector,
  );

  const objectFilterDropdownSearchInput = useAtomComponentStateValue(
    objectFilterDropdownSearchInputComponentState,
  );

  const componentInstanceId = useAvailableComponentInstanceIdOrThrow(
    ObjectFilterDropdownComponentInstanceContext,
  );

  const objectFilterDropdownCurrentRecordFilter = useAtomComponentStateValue(
    objectFilterDropdownCurrentRecordFilterComponentState,
  );

  const { applyObjectFilterDropdownFilterValue } =
    useApplyObjectFilterDropdownFilterValue();

  const selectedOptions = useMemo(
    () =>
      isNonEmptyString(objectFilterDropdownCurrentRecordFilter?.value)
        ? (z
            .array(z.string())
            .safeParse(parseJson(objectFilterDropdownCurrentRecordFilter.value))
            .data ?? [])
        : [],
    [objectFilterDropdownCurrentRecordFilter?.value],
  );

  const { closeDropdown } = useCloseDropdown();

  const { resetSelectedItem } = useSelectableList(componentInstanceId);

  const selectedItemId = useAtomComponentStateValue(
    selectedItemIdComponentState,
    componentInstanceId,
  );

  const { foundFieldMetadataItem: relationTargetFieldMetadataItem } =
    useAtomFamilySelectorValue(fieldMetadataItemByIdSelector, {
      fieldMetadataItemId:
        objectFilterDropdownCurrentRecordFilter?.relationTargetFieldMetadataId ??
        '',
    });

  const fieldMetaDataId = fieldMetadataItemUsedInDropdown?.id ?? '';

  const { selectOptions: sourceFieldSelectOptions } =
    useOptionsForSelect(fieldMetaDataId);

  const selectOptions = isDefined(relationTargetFieldMetadataItem)
    ? relationTargetFieldMetadataItem.options
    : sourceFieldSelectOptions;

  const [selectableOptions, setSelectableOptions] = useState<
    SelectOptionForFilter[]
  >([]);

  useEffect(() => {
    if (isDefined(selectOptions)) {
      const options = selectOptions.map((option) => {
        const isSelected = selectedOptions?.includes(option.value) ?? false;

        return {
          ...option,
          isSelected,
        };
      });

      setSelectableOptions(options);
    }
  }, [selectedOptions, selectOptions]);

  useHotkeysOnFocusedElement({
    keys: [Key.Escape],
    callback: () => {
      closeDropdown();
      resetSelectedItem();
    },
    focusId,
    dependencies: [closeDropdown, resetSelectedItem],
  });

  const applySelectableOptions = (
    newSelectableOptions: SelectOptionForFilter[],
  ) => {
    setSelectableOptions(newSelectableOptions);

    const selectedOptions = newSelectableOptions.filter(
      (option) => option.isSelected,
    );

    const filterDisplayValue =
      selectedOptions.length > MAX_OPTIONS_TO_DISPLAY
        ? `${selectedOptions.length} options`
        : selectedOptions.map((option) => option.label).join(', ');

    const newFilterValue =
      selectedOptions.length > 0
        ? JSON.stringify(selectedOptions.map((option) => option.value))
        : EMPTY_FILTER_VALUE;

    applyObjectFilterDropdownFilterValue(newFilterValue, filterDisplayValue);

    resetSelectedItem();
  };

  const handleMultipleOptionSelectChange = (
    optionChanged: SelectOptionForFilter,
    isSelected: boolean,
  ) => {
    if (!selectOptions) {
      return;
    }

    applySelectableOptions(
      selectableOptions.map((option) =>
        option.id === optionChanged.id ? { ...option, isSelected } : option,
      ),
    );
  };

  const optionsInDropdown = selectableOptions?.filter((option) =>
    option.label
      .toLowerCase()
      .includes(objectFilterDropdownSearchInput.toLowerCase()),
  );

  // Select-all applies only to the currently visible (search-filtered) options,
  // mirroring r3-team's ColumnFilter behavior.
  const visibleOptionIds = new Set(
    optionsInDropdown.map((option) => option.id),
  );

  const areAllVisibleOptionsSelected =
    optionsInDropdown.length > 0 &&
    optionsInDropdown.every((option) => option.isSelected);

  const handleSelectAllOptions = () => {
    if (!selectOptions) {
      return;
    }

    applySelectableOptions(
      selectableOptions.map((option) =>
        visibleOptionIds.has(option.id)
          ? { ...option, isSelected: true }
          : option,
      ),
    );
  };

  const handleClearAllOptions = () => {
    if (!selectOptions) {
      return;
    }

    applySelectableOptions(
      selectableOptions.map((option) => ({ ...option, isSelected: false })),
    );
  };

  const showNoResult = optionsInDropdown?.length === 0;

  const objectRecordsIds = optionsInDropdown.map((option) => option.id);

  return (
    <SelectableList
      selectableListInstanceId={componentInstanceId}
      selectableItemIdArray={objectRecordsIds}
      focusId={focusId}
    >
      {!showNoResult && (
        <>
          <DropdownMenuItemsContainer scrollable={false}>
            <MenuItem
              text={areAllVisibleOptionsSelected ? t`Clear all` : t`Select all`}
              onClick={
                areAllVisibleOptionsSelected
                  ? handleClearAllOptions
                  : handleSelectAllOptions
              }
            />
          </DropdownMenuItemsContainer>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItemsContainer hasMaxHeight>
        {showNoResult ? (
          <MenuItem text={t`No results`} />
        ) : (
          optionsInDropdown?.map((option) => (
            <MenuItemMultiSelect
              key={option.id}
              selected={option.isSelected}
              isKeySelected={option.id === selectedItemId}
              onSelectChange={(selected) =>
                handleMultipleOptionSelectChange(option, selected)
              }
              text={option.label}
              color={option.color}
              className=""
            />
          ))
        )}
      </DropdownMenuItemsContainer>
    </SelectableList>
  );
};
