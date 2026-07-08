import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { styled } from '@linaria/react';
import { MenuItem } from 'twenty-ui/navigation';

// Rendered in normal flow (not absolutely positioned) so the cell's
// OverlayContainer — which has overflow: hidden — grows to fit the list
// instead of clipping it, matching how the Select field input behaves.
const StyledDropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledSuggestionItem = styled.div`
  width: 100%;
`;

type FieldValueSuggestionsDropdownProps = {
  suggestions: string[];
  onSelect: (value: string) => void;
};

export const FieldValueSuggestionsDropdown = ({
  suggestions,
  onSelect,
}: FieldValueSuggestionsDropdownProps) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <StyledDropdownContainer>
      <DropdownMenuSeparator />
      <DropdownMenuItemsContainer hasMaxHeight>
        {suggestions.map((suggestion) => (
          // Select on mousedown so the input does not blur first and trigger a
          // click-outside that closes the cell before the selection registers.
          <StyledSuggestionItem
            key={suggestion}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
          >
            <MenuItem text={suggestion} />
          </StyledSuggestionItem>
        ))}
      </DropdownMenuItemsContainer>
    </StyledDropdownContainer>
  );
};
