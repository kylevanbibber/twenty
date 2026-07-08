import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { getFieldMetadataItemById } from '@/object-metadata/utils/getFieldMetadataItemById';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useContext } from 'react';

// Resolves the singular object name for the field currently being edited, used
// to query existing column values for type-ahead suggestions. Returns '' when
// it cannot be resolved (e.g. metadata not loaded), which callers use to skip
// suggestions entirely.
export const useFieldInputObjectNameSingular = (): string => {
  const { fieldMetadataItemId } = useContext(FieldContext);

  const { objectMetadataItems } = useObjectMetadataItems();

  const { objectMetadataItem } = getFieldMetadataItemById({
    fieldMetadataId: fieldMetadataItemId ?? '',
    objectMetadataItems,
  });

  return objectMetadataItem?.nameSingular ?? '';
};
