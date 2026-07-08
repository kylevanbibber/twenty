import { useColumnValueSuggestions } from '@/object-record/record-field/ui/meta-types/hooks/useColumnValueSuggestions';
import { FieldValueSuggestionsDropdown } from '@/object-record/record-field/ui/meta-types/input/components/FieldValueSuggestionsDropdown';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useCallback, useMemo } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type FieldValueSuggestionsProps = {
  objectNameSingular: string;
  fieldName: string;
  // For composite fields (emails, phones, full name) the value lives in a
  // sub-field, e.g. `primaryEmail`, `primaryPhoneNumber`, `firstName`.
  compositeSubFieldName?: string;
  searchValue: string;
  onSelect: (value: string) => void;
};

// Rendered only once the object name and search value are known, so the
// underlying find-many query (which resolves object metadata eagerly) never
// runs with an invalid object name.
export const FieldValueSuggestions = ({
  objectNameSingular,
  fieldName,
  compositeSubFieldName,
  searchValue,
  onSelect,
}: FieldValueSuggestionsProps) => {
  const buildFilter = useCallback(
    (search: string): RecordGqlOperationFilter => {
      const leafFilter = { ilike: `%${search}%` };

      return isDefined(compositeSubFieldName)
        ? { [fieldName]: { [compositeSubFieldName]: leafFilter } }
        : { [fieldName]: leafFilter };
    },
    [fieldName, compositeSubFieldName],
  );

  const recordGqlFields = useMemo(
    () =>
      isDefined(compositeSubFieldName)
        ? { id: true, [fieldName]: { [compositeSubFieldName]: true } }
        : { id: true, [fieldName]: true },
    [fieldName, compositeSubFieldName],
  );

  const extractValue = useCallback(
    (record: ObjectRecord): string | undefined | null => {
      const fieldValue = record[fieldName];

      if (isDefined(compositeSubFieldName)) {
        return isDefined(fieldValue)
          ? fieldValue[compositeSubFieldName]
          : undefined;
      }

      return fieldValue;
    },
    [fieldName, compositeSubFieldName],
  );

  const { suggestions } = useColumnValueSuggestions({
    objectNameSingular,
    searchValue,
    buildFilter,
    recordGqlFields,
    extractValue,
  });

  return (
    <FieldValueSuggestionsDropdown
      suggestions={suggestions}
      onSelect={onSelect}
    />
  );
};
