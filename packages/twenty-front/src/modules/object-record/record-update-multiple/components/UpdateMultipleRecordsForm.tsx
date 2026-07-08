import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { FormFieldInput } from '@/object-record/record-field/ui/components/FormFieldInput';
import { type UpdateMultipleRecordsState } from '@/object-record/record-update-multiple/components/UpdateMultipleRecordsContainer';
import {
  getMultiEditFieldInputName,
  normalizeMultiEditValue,
} from '@/object-record/record-update-multiple/utils/getMultiEditUpdateInput';
import { shouldDisplayFormMultiEditField } from '@/object-record/record-update-multiple/utils/shouldDisplayFormMultiEditField';
import { styled } from '@linaria/react';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSectionContainer = styled.div`
  > * {
    display: flex;
    flex-direction: column;
    gap: ${themeCssVariables.spacing[6]};
    padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[3]};
    width: auto;
  }
`;

export type UpdateMultipleRecordsFormProps = {
  objectNameSingular: string;
  disabled?: boolean;
  values: UpdateMultipleRecordsState;
  onChange: (fieldName: string, value: any) => void;
};

export const UpdateMultipleRecordsForm = ({
  objectNameSingular,
  disabled = false,
  values,
  onChange,
}: UpdateMultipleRecordsFormProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const editableFields = objectMetadataItem.fields
    .filter(shouldDisplayFormMultiEditField)
    .sort((fieldA, fieldB) => fieldA.name.localeCompare(fieldB.name));

  const fieldsWithDefinitions = editableFields.map((fieldMetadataItem) => ({
    fieldMetadataItem,
    fieldDefinition: formatFieldMetadataItemAsFieldDefinition({
      field: fieldMetadataItem,
      objectMetadataItem,
      showLabel: true,
      labelWidth: 90,
    }),
  }));

  return (
    <StyledSectionContainer>
      <Section>
        {fieldsWithDefinitions.map(({ fieldMetadataItem, fieldDefinition }) => {
          const fieldNameOrRelationIdName = getMultiEditFieldInputName({
            fieldMetadataItem,
            fieldDefinition,
          });

          const value = values[fieldNameOrRelationIdName];

          const handleValueChange = (newValue: any) => {
            onChange(
              fieldNameOrRelationIdName,
              normalizeMultiEditValue(newValue),
            );
          };

          return (
            <FormFieldInput
              key={fieldDefinition.metadata.fieldName}
              readonly={disabled}
              field={fieldDefinition}
              defaultValue={value}
              onChange={handleValueChange}
              onClear={() => onChange(fieldNameOrRelationIdName, undefined)}
            />
          );
        })}
      </Section>
    </StyledSectionContainer>
  );
};
