import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldRelation } from '@/object-record/record-field/ui/types/guards/isFieldRelation';
import { isUpdateRecordValueEmpty } from '@/object-record/record-update-multiple/utils/isUpdateRecordValueEmpty';
import { FieldMetadataType } from 'twenty-shared/types';
import { computeRelationGqlFieldJoinColumnName } from 'twenty-shared/utils';

// A relation field is persisted through its join column (e.g. `companyId`),
// whereas every other field uses its own name. The multi-edit form keys its
// state by this name, so both the form and the inline bulk-edit share it.
export const getMultiEditFieldInputName = ({
  fieldMetadataItem,
  fieldDefinition,
}: {
  fieldMetadataItem: FieldMetadataItem;
  fieldDefinition: FieldDefinition<FieldMetadata>;
}): string => {
  const isRelation = isFieldRelation(fieldDefinition);

  return isRelation && fieldMetadataItem.type === FieldMetadataType.RELATION
    ? computeRelationGqlFieldJoinColumnName({ name: fieldMetadataItem.name })
    : fieldDefinition.metadata.fieldName;
};

// Normalizes a raw FormFieldInput value into what should be persisted:
// - `null` is an explicit clear
// - an "empty" value means "no change" (`undefined`)
// - anything else is sent as-is
export const normalizeMultiEditValue = (value: any): any => {
  if (value === null) {
    return null;
  }

  if (isUpdateRecordValueEmpty(value)) {
    return undefined;
  }

  return value;
};
