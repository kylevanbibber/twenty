import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { WorkflowVisualizerComponentInstanceContext } from '@/workflow/workflow-diagram/states/contexts/WorkflowVisualizerComponentInstanceContext';

export type WorkflowNodeFocusRequest = {
  nodeId: string;
  requestId: number;
};

export const workflowNodeFocusRequestComponentState = createAtomComponentState<
  WorkflowNodeFocusRequest | undefined
>({
  key: 'workflowNodeFocusRequestComponentState',
  defaultValue: undefined,
  componentInstanceContext: WorkflowVisualizerComponentInstanceContext,
});
