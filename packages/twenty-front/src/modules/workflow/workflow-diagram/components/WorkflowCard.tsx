import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useWorkflowWithCurrentVersion } from '@/workflow/hooks/useWorkflowWithCurrentVersion';
import { getWorkflowVisualizerComponentInstanceId } from '@/workflow/utils/getWorkflowVisualizerComponentInstanceId';
import {
  hasWorkflowEmailActions,
  WorkflowEmailTemplatesPanel,
} from '@/workflow/workflow-email-templates/components/WorkflowEmailTemplatesPanel';
import { WorkflowDiagramCanvasEditable } from '@/workflow/workflow-diagram/components/WorkflowDiagramCanvasEditable';
import { WorkflowDiagramEffect } from '@/workflow/workflow-diagram/components/WorkflowDiagramEffect';
import { WorkflowSSESubscribeEffect } from '@/workflow/workflow-diagram/components/WorkflowSSESubscribeEffect';
import { WorkflowVisualizerEffect } from '@/workflow/workflow-diagram/components/WorkflowVisualizerEffect';
import { WorkflowVisualizerComponentInstanceContext } from '@/workflow/workflow-diagram/states/contexts/WorkflowVisualizerComponentInstanceContext';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledWorkflowWithTemplates = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const StyledWorkflowCanvas = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
`;

const StyledEmailTemplatesPanelContainer = styled.div`
  flex: 0 0 520px;
  min-height: 0;

  @media (max-width: 900px) {
    border-top: 1px solid ${themeCssVariables.border.color.medium};
    flex: 0 0 50%;
  }
`;

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
      <StyledWorkflowWithTemplates>
        <StyledWorkflowCanvas>
          <WorkflowDiagramCanvasEditable />
        </StyledWorkflowCanvas>
        {shouldShowEmailTemplatesPanel && workflow?.currentVersion && (
          <StyledEmailTemplatesPanelContainer>
            <WorkflowEmailTemplatesPanel
              shouldFocusWorkflowNodeOnSelect
              workflowVersion={workflow.currentVersion}
            />
          </StyledEmailTemplatesPanelContainer>
        )}
      </StyledWorkflowWithTemplates>
    </WorkflowVisualizerComponentInstanceContext.Provider>
  );
};
