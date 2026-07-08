import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const composeEmailDefaultCcComponentState =
  createAtomComponentState<string>({
    key: 'side-panel/compose-email-default-cc',
    defaultValue: '',
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
