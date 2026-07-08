import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { MainNavigationDrawerNavigationContent } from '@/navigation/components/MainNavigationDrawerNavigationContent';
import { NavigationDrawerTabbedContent } from '@/navigation/components/NavigationDrawerTabbedContent';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const MainNavigationDrawer = ({ className }: { className?: string }) => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  return (
    <NavigationDrawer
      className={className}
      title={currentWorkspace?.displayName ?? ''}
    >
      <NavigationDrawerScrollableContent>
        <NavigationDrawerTabbedContent
          showAiChatContent={false}
          shouldMountAiChatContent={false}
          navigationContent={<MainNavigationDrawerNavigationContent />}
        />
      </NavigationDrawerScrollableContent>
    </NavigationDrawer>
  );
};
