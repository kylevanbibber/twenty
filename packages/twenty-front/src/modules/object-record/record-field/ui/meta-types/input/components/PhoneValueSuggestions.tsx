import { useColumnValueSuggestions } from '@/object-record/record-field/ui/meta-types/hooks/useColumnValueSuggestions';
import { FieldValueSuggestionsDropdown } from '@/object-record/record-field/ui/meta-types/input/components/FieldValueSuggestionsDropdown';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isNonEmptyString } from '@sniptt/guards';
import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useMemo } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Phones are stored split (national number + calling code) but the input works
// in E.164, so we match existing numbers on their national digits and suggest
// the full E.164 value, which the phone input can re-parse when selected.
const getNationalDigits = (rawValue: string): string => {
  try {
    const parsedPhone = parsePhoneNumber(rawValue);

    if (isNonEmptyString(parsedPhone?.nationalNumber)) {
      return parsedPhone.nationalNumber;
    }
  } catch {
    // Ignore parse errors for partial input and fall back to raw digits.
  }

  return rawValue.replace(/\D/g, '');
};

type PhoneValueSuggestionsProps = {
  objectNameSingular: string;
  fieldName: string;
  searchValue: string;
  onSelect: (value: string) => void;
};

export const PhoneValueSuggestions = ({
  objectNameSingular,
  fieldName,
  searchValue,
  onSelect,
}: PhoneValueSuggestionsProps) => {
  const buildFilter = useCallback(
    (search: string): RecordGqlOperationFilter => ({
      [fieldName]: { primaryPhoneNumber: { ilike: `%${search}%` } },
    }),
    [fieldName],
  );

  const recordGqlFields = useMemo(
    () => ({
      id: true,
      [fieldName]: { primaryPhoneNumber: true, primaryPhoneCallingCode: true },
    }),
    [fieldName],
  );

  const extractValue = useCallback(
    (record: ObjectRecord): string | undefined => {
      const fieldValue = record[fieldName];

      if (!isDefined(fieldValue)) {
        return undefined;
      }

      const number = fieldValue.primaryPhoneNumber;
      const callingCode = fieldValue.primaryPhoneCallingCode ?? '';

      return isNonEmptyString(number) ? `${callingCode}${number}` : undefined;
    },
    [fieldName],
  );

  const { suggestions } = useColumnValueSuggestions({
    objectNameSingular,
    searchValue: getNationalDigits(searchValue),
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
