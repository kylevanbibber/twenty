import { FormFieldInput } from '@/object-record/record-field/ui/components/FormFieldInput';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { normalizeMultiEditValue } from '@/object-record/record-update-multiple/utils/getMultiEditUpdateInput';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { type JsonValue } from 'type-fest';
import { IconCheck } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledFooter = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

type InlineBulkEditFieldContentProps = {
  fieldDefinition: FieldDefinition<FieldMetadata>;
  selectedCount: number;
  onApply: (value: JsonValue) => void;
  onCancel: () => void;
};

export const InlineBulkEditFieldContent = ({
  fieldDefinition,
  selectedCount,
  onApply,
  onCancel,
}: InlineBulkEditFieldContentProps) => {
  const { t } = useLingui();

  const [value, setValue] = useState<JsonValue>(null);

  const canApply = normalizeMultiEditValue(value) !== undefined;

  return (
    <StyledContainer>
      <FormFieldInput
        field={fieldDefinition}
        defaultValue={value}
        onChange={setValue}
        onClear={() => setValue(null)}
      />
      <StyledFooter>
        <Button
          title={t`Cancel`}
          variant="secondary"
          size="small"
          onClick={onCancel}
        />
        <Button
          title={t`Apply to ${selectedCount}`}
          variant="primary"
          accent="blue"
          size="small"
          Icon={IconCheck}
          disabled={!canApply}
          onClick={() => onApply(value)}
        />
      </StyledFooter>
    </StyledContainer>
  );
};
