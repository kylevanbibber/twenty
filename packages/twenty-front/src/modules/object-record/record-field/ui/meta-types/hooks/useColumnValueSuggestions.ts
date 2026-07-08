import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isNonEmptyString } from '@sniptt/guards';
import { useMemo } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useDebounce } from 'use-debounce';

const MAX_VALUE_SUGGESTIONS = 8;
const SUGGESTIONS_SEARCH_LIMIT = 30;

// Suggests values that already exist in the same column across the workspace,
// matched against what the user is currently typing (r3-team's autocomplete).
// Generic over the field's storage shape: callers provide how to build the
// server filter, which fields to fetch, and how to read the value out.
export const useColumnValueSuggestions = ({
  objectNameSingular,
  searchValue,
  buildFilter,
  recordGqlFields,
  extractValue,
}: {
  objectNameSingular: string;
  searchValue: string;
  buildFilter: (search: string) => RecordGqlOperationFilter;
  recordGqlFields: Record<string, any>;
  extractValue: (record: ObjectRecord) => string | undefined | null;
}) => {
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const trimmedSearch = debouncedSearchValue.trim();
  const isEnabled =
    isNonEmptyString(objectNameSingular) && isNonEmptyString(trimmedSearch);

  const { records } = useFindManyRecords<ObjectRecord>({
    objectNameSingular,
    skip: !isEnabled,
    filter: isEnabled ? buildFilter(trimmedSearch) : undefined,
    recordGqlFields,
    limit: SUGGESTIONS_SEARCH_LIMIT,
  });

  const suggestions = useMemo(() => {
    if (!isEnabled) {
      return [];
    }

    const lowerCaseSearch = trimmedSearch.toLowerCase();
    const seenValues = new Set<string>();
    const distinctValues: string[] = [];

    for (const record of records) {
      const value = extractValue(record);

      if (!isDefined(value) || !isNonEmptyString(value)) {
        continue;
      }

      const lowerCaseValue = value.toLowerCase();

      // Skip an exact match — the value the user already typed is not a suggestion.
      if (lowerCaseValue === lowerCaseSearch || seenValues.has(value)) {
        continue;
      }

      seenValues.add(value);
      distinctValues.push(value);

      if (distinctValues.length >= MAX_VALUE_SUGGESTIONS) {
        break;
      }
    }

    return distinctValues;
  }, [records, extractValue, trimmedSearch, isEnabled]);

  return { suggestions };
};
