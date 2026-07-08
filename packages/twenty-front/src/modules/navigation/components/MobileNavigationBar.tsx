import { useLingui } from '@lingui/react/macro';

import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreCurrentObjectMetadataItemIdComponentState } from '@/context-store/states/contextStoreCurrentObjectMetadataItemIdComponentState';
import { useDefaultHomePagePath } from '@/navigation/hooks/useDefaultHomePagePath';
import { useIsSettingsPage } from '@/navigation/hooks/useIsSettingsPage';
import { currentMobileNavigationDrawerState } from '@/navigation/states/currentMobileNavigationDrawerState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useNavigate } from 'react-router-dom';
import { type IconComponent, IconList, IconSearch } from 'twenty-ui/icon';
import { NavigationBar } from 'twenty-ui/navigation';

type NavigationBarItemName = 'main' | 'search';

export const MobileNavigationBar = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { defaultHomePagePath } = useDefaultHomePagePath();
  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);
  const navigationMemorizedUrl = useAtomStateValue(navigationMemorizedUrlState);
  const { closeSidePanelMenu } = useSidePanelMenu();
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const isSettingsPage = useIsSettingsPage();
  const [isNavigationDrawerExpanded, setIsNavigationDrawerExpanded] =
    useAtomState(isNavigationDrawerExpandedState);
  const [currentMobileNavigationDrawer, setCurrentMobileNavigationDrawer] =
    useAtomState(currentMobileNavigationDrawerState);
  const { alphaSortedActiveNonSystemObjectMetadataItems } =
    useFilteredObjectMetadataItems();

  const setContextStoreCurrentObjectMetadataItemId = useSetAtomComponentState(
    contextStoreCurrentObjectMetadataItemIdComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  const activeItemName = isNavigationDrawerExpanded
    ? currentMobileNavigationDrawer
    : isSidePanelOpened
      ? 'search'
      : 'main';

  const items: {
    name: NavigationBarItemName;
    label: string;
    Icon: IconComponent;
    onClick: () => void;
  }[] = [
    {
      name: 'main',
      label: t`Main navigation`,
      Icon: IconList,
      onClick: () => {
        closeSidePanelMenu();
        setIsNavigationDrawerExpanded(
          (previousIsOpen) => activeItemName !== 'main' || !previousIsOpen,
        );
        setCurrentMobileNavigationDrawer('main');

        if (isSettingsPage) {
          navigate(
            navigationMemorizedUrl !== '/'
              ? navigationMemorizedUrl
              : defaultHomePagePath,
          );
        }
      },
    },
    {
      name: 'search',
      label: t`Search`,
      Icon: IconSearch,
      onClick: () => {
        setIsNavigationDrawerExpanded(false);
        closeSidePanelMenu();

        if (isSettingsPage) {
          const firstObjectMetadataItem =
            alphaSortedActiveNonSystemObjectMetadataItems[0];
          if (firstObjectMetadataItem !== undefined) {
            setContextStoreCurrentObjectMetadataItemId(
              firstObjectMetadataItem.id,
            );
          }
        }

        openRecordsSearchPage();
      },
    },
  ];

  return <NavigationBar activeItemName={activeItemName} items={items} />;
};
