import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { useSortedNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useSortedNavigationMenuItems';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { ViewKey } from '@/views/types/ViewKey';

import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { IconMail, IconSettingsAutomation } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

export const MainNavigationDrawerScrollableItems = () => {
  const location = useLocation();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const { workspaceNavigationMenuItemsSorted } = useSortedNavigationMenuItems();

  const workflowObjectMetadataItem = objectMetadataItems.find(
    (item) => item.namePlural === 'workflows' && item.isActive,
  );
  const hasWorkflowNavigationItem =
    isDefined(workflowObjectMetadataItem) &&
    workspaceNavigationMenuItemsSorted.some(
      (item) =>
        item.targetObjectMetadataId === workflowObjectMetadataItem.id &&
        !isDefined(item.folderId),
    );
  const workflowIndexViewId = isDefined(workflowObjectMetadataItem)
    ? views.find(
        (view) =>
          view.objectMetadataId === workflowObjectMetadataItem.id &&
          view.key === ViewKey.INDEX,
      )?.id
    : undefined;
  const workflowPath = getAppPath(
    AppPath.RecordIndexPage,
    { objectNamePlural: 'workflows' },
    isDefined(workflowIndexViewId)
      ? { viewId: workflowIndexViewId }
      : undefined,
  );

  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
        <FavoritesSectionDispatcher />
        <WorkspaceSectionDispatcher />
      </Suspense>
      <NavigationDrawerSection>
        {isDefined(workflowObjectMetadataItem) &&
          !hasWorkflowNavigationItem && (
            <NavigationDrawerItem
              label="Workflows"
              to={workflowPath}
              Icon={IconSettingsAutomation}
              active={location.pathname === '/objects/workflows'}
            />
          )}
        <NavigationDrawerItem
          label="Email Templates"
          to="/campaign-templates"
          Icon={IconMail}
          active={location.pathname === '/campaign-templates'}
        />
      </NavigationDrawerSection>
    </StyledScrollableItemsContainer>
  );
};
