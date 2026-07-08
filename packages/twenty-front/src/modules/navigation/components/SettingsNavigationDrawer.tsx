import { NavigationDrawerTabbedContent } from '@/navigation/components/NavigationDrawerTabbedContent';
import { SettingsNavigationDrawerItems } from '@/settings/components/SettingsNavigationDrawerItems';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { isAdvancedModeEnabledState } from '@/ui/navigation/navigation-drawer/states/isAdvancedModeEnabledState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useIsMobile } from 'twenty-ui/utilities';
import { AdvancedSettingsToggle } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledAdvancedToggleFixedContent = styled.div<{ isMobile: boolean }>`
  flex-shrink: 0;
  margin-top: auto;
  padding-left: ${({ isMobile }) =>
    isMobile ? themeCssVariables.spacing[5] : '0'};
  padding-right: ${({ isMobile }) =>
    isMobile ? themeCssVariables.spacing[5] : '0'};
`;

const advancedSettingsToggleClassName = css`
  padding-right: 0;
`;

export const SettingsNavigationDrawer = ({
  className,
}: {
  className?: string;
}) => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const [isAdvancedModeEnabled, setIsAdvancedModeEnabled] = useAtomState(
    isAdvancedModeEnabledState,
  );

  return (
    <NavigationDrawer className={className} title={t`Settings`}>
      <NavigationDrawerScrollableContent>
        <NavigationDrawerTabbedContent
          showAiChatContent={false}
          shouldMountAiChatContent={false}
          navigationContent={<SettingsNavigationDrawerItems />}
        />
      </NavigationDrawerScrollableContent>

      <StyledAdvancedToggleFixedContent isMobile={isMobile}>
        <NavigationDrawerSection>
          <AdvancedSettingsToggle
            className={advancedSettingsToggleClassName}
            isAdvancedModeEnabled={isAdvancedModeEnabled}
            setIsAdvancedModeEnabled={setIsAdvancedModeEnabled}
            label={t`Advanced`}
          />
        </NavigationDrawerSection>
      </StyledAdvancedToggleFixedContent>
    </NavigationDrawer>
  );
};
