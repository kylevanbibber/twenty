import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { useWorkflowWithCurrentVersion } from '@/workflow/hooks/useWorkflowWithCurrentVersion';
import {
  hasWorkflowEmailActions,
  WorkflowEmailTemplatesPanel,
} from '@/workflow/workflow-email-templates/components/WorkflowEmailTemplatesPanel';
import { isDefined } from 'twenty-shared/utils';

export const WorkflowEmailTemplatesWidget = () => {
  const targetRecord = useTargetRecord();
  const workflow = useWorkflowWithCurrentVersion(targetRecord.id);

  if (
    !isDefined(workflow?.currentVersion) ||
    !hasWorkflowEmailActions(workflow.currentVersion)
  ) {
    return null;
  }

  return (
    <WorkflowEmailTemplatesPanel workflowVersion={workflow.currentVersion} />
  );
};
