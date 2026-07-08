import { TextAreaInput } from '@/ui/field/input/components/TextAreaInput';

import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';

import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFieldInputObjectNameSingular } from '@/object-record/record-field/ui/meta-types/hooks/useFieldInputObjectNameSingular';
import { FieldValueSuggestions } from '@/object-record/record-field/ui/meta-types/input/components/FieldValueSuggestions';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';

import { FieldInputContainer } from '@/ui/field/input/components/FieldInputContainer';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { turnIntoUndefinedIfWhitespacesOnly } from '~/utils/string/turnIntoUndefinedIfWhitespacesOnly';

const StyledInputWithSuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

// Keeps the textarea's absolutely-positioned copy button anchored to the
// input row rather than to the whole column.
const StyledInputRow = styled.div`
  align-items: center;
  display: flex;
  min-height: 32px;
  position: relative;
  width: 100%;
`;

export const TextFieldInput = () => {
  const { fieldDefinition, draftValue, setDraftValue } = useTextField();

  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab } = useContext(
    FieldInputEventContext,
  );

  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );

  const objectNameSingular = useFieldInputObjectNameSingular();

  const handleEnter = (newText: string) => {
    onEnter?.({ newValue: newText.trim() });
  };

  const handleEscape = (newText: string) => {
    onEscape?.({ newValue: newText.trim() });
  };

  const handleClickOutside = (
    event: MouseEvent | TouchEvent,
    newText: string,
  ) => {
    onClickOutside?.({
      newValue: newText.trim(),
      event,
    });
  };

  const handleTab = (newText: string) => {
    onTab?.({ newValue: newText.trim() });
  };

  const handleShiftTab = (newText: string) => {
    onShiftTab?.({ newValue: newText.trim() });
  };

  const handleChange = (newText: string) => {
    setDraftValue(turnIntoUndefinedIfWhitespacesOnly(newText));
  };

  const handleSuggestionSelect = (value: string) => {
    setDraftValue(value);
    onEnter?.({ newValue: value });
  };

  const searchValue = draftValue ?? '';

  const shouldShowSuggestions =
    isNonEmptyString(objectNameSingular) && isNonEmptyString(searchValue);

  return (
    <FieldInputContainer>
      <StyledInputWithSuggestionsContainer>
        <StyledInputRow>
          <TextAreaInput
            instanceId={instanceId}
            placeholder={fieldDefinition.metadata.placeHolder}
            autoFocus
            value={draftValue ?? ''}
            onClickOutside={handleClickOutside}
            onEnter={handleEnter}
            onEscape={handleEscape}
            onShiftTab={handleShiftTab}
            onTab={handleTab}
            onChange={handleChange}
          />
        </StyledInputRow>
        {shouldShowSuggestions && (
          <FieldValueSuggestions
            objectNameSingular={objectNameSingular}
            fieldName={fieldDefinition.metadata.fieldName}
            searchValue={searchValue}
            onSelect={handleSuggestionSelect}
          />
        )}
      </StyledInputWithSuggestionsContainer>
    </FieldInputContainer>
  );
};
