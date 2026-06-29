import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useWorkflowWithCurrentVersion } from '@/workflow/hooks/useWorkflowWithCurrentVersion';
import { getWorkflowVisualizerComponentInstanceId } from '@/workflow/utils/getWorkflowVisualizerComponentInstanceId';
import { WorkflowDiagramCanvasEditable } from '@/workflow/workflow-diagram/components/WorkflowDiagramCanvasEditable';
import { WorkflowDiagramEffect } from '@/workflow/workflow-diagram/components/WorkflowDiagramEffect';
import { WorkflowSSESubscribeEffect } from '@/workflow/workflow-diagram/components/WorkflowSSESubscribeEffect';
import { WorkflowVisualizerEffect } from '@/workflow/workflow-diagram/components/WorkflowVisualizerEffect';
import { WorkflowVisualizerComponentInstanceContext } from '@/workflow/workflow-diagram/states/contexts/WorkflowVisualizerComponentInstanceContext';
import { workflowNodeFocusRequestComponentState } from '@/workflow/workflow-diagram/states/workflowNodeFocusRequestComponentState';
import {
  hasWorkflowEmailActions,
  WorkflowEmailTemplatesPanel,
} from '@/workflow/workflow-email-templates/components/WorkflowEmailTemplatesPanel';
import { type WorkflowVersion } from '@/workflow/types/Workflow';
import { styled } from '@linaria/react';
import { Panel } from '@xyflow/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledEmailTemplatesPanelOverlay = styled.div`
  box-shadow: ${themeCssVariables.boxShadow.strong};
  height: min(720px, calc(100vh - 160px));
  max-height: calc(100vh - 160px);
  width: min(520px, calc(100vw - 320px));

  @media (max-width: 900px) {
    height: min(560px, calc(100vh - 160px));
    width: min(420px, calc(100vw - 48px));
  }
`;

const WorkflowEmailTemplatesCanvasPanel = ({
  workflowVersion,
}: {
  workflowVersion: WorkflowVersion;
}) => {
  const setWorkflowNodeFocusRequest = useSetAtomComponentState(
    workflowNodeFocusRequestComponentState,
  );

  return (
    <Panel className="nodrag nopan" position="top-right">
      <StyledEmailTemplatesPanelOverlay>
        <WorkflowEmailTemplatesPanel
          onEmailSelect={(stepId) => {
            setWorkflowNodeFocusRequest({
              nodeId: stepId,
              requestId: Date.now(),
            });
          }}
          workflowVersion={workflowVersion}
        />
      </StyledEmailTemplatesPanelOverlay>
    </Panel>
  );
};

export const WorkflowCard = () => {
  const targetRecord = useTargetRecord();
  const workflow = useWorkflowWithCurrentVersion(targetRecord.id);
  const shouldShowEmailTemplatesPanel = hasWorkflowEmailActions(
    workflow?.currentVersion,
  );

  return (
    <WorkflowVisualizerComponentInstanceContext.Provider
      value={{
        instanceId: getWorkflowVisualizerComponentInstanceId({
          recordId: targetRecord.id,
        }),
      }}
    >
      <WorkflowVisualizerEffect workflowId={targetRecord.id} />
      <WorkflowSSESubscribeEffect workflowId={targetRecord.id} />
      <WorkflowDiagramEffect />
      <WorkflowDiagramCanvasEditable>
        {shouldShowEmailTemplatesPanel && workflow?.currentVersion && (
          <WorkflowEmailTemplatesCanvasPanel
            workflowVersion={workflow.currentVersion}
          />
        )}
      </WorkflowDiagramCanvasEditable>
    </WorkflowVisualizerComponentInstanceContext.Provider>
  );
};
