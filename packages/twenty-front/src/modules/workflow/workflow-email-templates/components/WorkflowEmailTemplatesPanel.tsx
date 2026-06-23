import { TextArea } from '@/ui/input/components/TextArea';
import { TextInput } from '@/ui/input/components/TextInput';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import {
  type WorkflowStep,
  type WorkflowVersion,
} from '@/workflow/types/Workflow';
import { type WorkflowEmailAction } from '@/workflow/types/WorkflowEmailAction';
import { workflowNodeFocusRequestComponentState } from '@/workflow/workflow-diagram/states/workflowNodeFocusRequestComponentState';
import { useUpdateWorkflowVersionStep } from '@/workflow/workflow-steps/hooks/useUpdateWorkflowVersionStep';
import { styled } from '@linaria/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTwoPane = styled.div`
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
`;

const StyledFlow = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: ${themeCssVariables.spacing[2]};
  width: 180px;
`;

const StyledTriggerNode = styled.div`
  align-self: flex-start;
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

const StyledConnector = styled.div`
  background: ${themeCssVariables.border.color.strong};
  height: ${themeCssVariables.spacing[3]};
  margin-left: ${themeCssVariables.spacing[4]};
  width: 2px;
`;

const StyledEmailNode = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    border-color: ${themeCssVariables.border.color.strong};
  }

  &[data-active='true'] {
    border-color: ${themeCssVariables.color.blue};
    box-shadow: 0 0 0 1px ${themeCssVariables.color.blue};
  }
`;

const StyledNodeName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledNodeSubject = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBranchRow = styled.div`
  border-left: 2px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin: ${themeCssVariables.spacing[1]} 0 ${themeCssVariables.spacing[1]}
    ${themeCssVariables.spacing[4]};
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledBranch = styled.span`
  border-radius: ${themeCssVariables.border.radius.sm};
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};

  &[data-tone='stop'] {
    color: ${themeCssVariables.font.color.tertiary};
  }

  &[data-tone='continue'] {
    color: ${themeCssVariables.color.blue};
  }
`;

const StyledEditor = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  overflow-y: auto;
`;

const StyledStepName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSummary = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledSpacer = styled.div`
  flex: 1;
`;

const StyledSaved = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type EmailModel = {
  id: string;
  name: string;
  subject: string;
  body: string;
  original: WorkflowEmailAction;
  delayDays: number;
  noResponseTarget: string;
};

type StepWithInput = WorkflowStep & {
  settings?: {
    input?: {
      branches?: Array<{
        filterGroupId?: string;
        nextStepIds?: string[];
      }>;
      duration?: {
        days?: unknown;
      };
    };
  };
};

const isWorkflowEmailAction = (
  step: WorkflowStep,
): step is WorkflowEmailAction =>
  step.type === 'SEND_EMAIL' || step.type === 'DRAFT_EMAIL';

export const hasWorkflowEmailActions = (
  workflowVersion: Pick<WorkflowVersion, 'steps'> | undefined,
) => workflowVersion?.steps?.some(isWorkflowEmailAction) ?? false;

const getEmailModels = (steps: WorkflowStep[]): EmailModel[] => {
  const byId: Record<string, WorkflowStep> = Object.fromEntries(
    steps.map((step) => [step.id, step]),
  );

  return steps
    .filter(isWorkflowEmailAction)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((emailStep) => {
      const delayStepId = emailStep.nextStepIds?.[0];
      const delayStep = delayStepId
        ? (byId[delayStepId] as StepWithInput | undefined)
        : undefined;
      const delayDays = delayStep?.settings?.input?.duration?.days;
      const ifElseStepId = delayStep?.nextStepIds?.[0];
      const ifElseStep = ifElseStepId
        ? (byId[ifElseStepId] as StepWithInput | undefined)
        : undefined;
      const branches = ifElseStep?.settings?.input?.branches ?? [];
      const elseBranch = branches.find((branch) => !branch.filterGroupId);
      const elseLeafStepId = elseBranch?.nextStepIds?.[0];
      const elseLeaf = elseLeafStepId ? byId[elseLeafStepId] : undefined;
      const nextSendStepId = elseLeaf?.nextStepIds?.[0];
      const nextSend = nextSendStepId ? byId[nextSendStepId] : undefined;

      return {
        id: emailStep.id,
        name: emailStep.name,
        subject: emailStep.settings?.input?.subject ?? '',
        body: emailStep.settings?.input?.body ?? '',
        original: emailStep,
        delayDays: typeof delayDays === 'number' ? delayDays : 7,
        noResponseTarget: nextSend?.name ?? 'campaign ends',
      };
    });
};

type WorkflowEmailTemplatesPanelProps = {
  shouldFocusWorkflowNodeOnSelect?: boolean;
  title?: string;
  workflowVersion: WorkflowVersion;
};

export const WorkflowEmailTemplatesPanel = ({
  shouldFocusWorkflowNodeOnSelect = false,
  title = 'Email templates',
  workflowVersion,
}: WorkflowEmailTemplatesPanelProps) => {
  const { updateWorkflowVersionStep } = useUpdateWorkflowVersionStep();
  const setWorkflowNodeFocusRequest = useSetAtomComponentState(
    workflowNodeFocusRequestComponentState,
  );

  const emails = useMemo(
    () => getEmailModels(workflowVersion.steps ?? []),
    [workflowVersion.steps],
  );

  const [items, setItems] = useState<EmailModel[]>([]);
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  useEffect(() => {
    setItems(emails);
    setIndex((currentIndex) =>
      emails.length === 0
        ? 0
        : Math.max(0, Math.min(currentIndex, emails.length - 1)),
    );
  }, [emails]);

  if (items.length === 0) {
    return null;
  }

  const current = items[index];

  const setField = (field: 'subject' | 'body', value: string) => {
    setItems((previousItems) =>
      previousItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
    setSaveState('idle');
  };

  const handleSave = async () => {
    setSaveState('saving');

    const updatedStep: WorkflowEmailAction = {
      ...current.original,
      settings: {
        ...current.original.settings,
        input: {
          ...current.original.settings.input,
          subject: current.subject,
          body: current.body,
        },
      },
    };

    const result = await updateWorkflowVersionStep({
      workflowVersionId: workflowVersion.id,
      step: updatedStep,
    });

    if (!result?.data?.updateWorkflowVersionStep) {
      setSaveState('idle');
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, original: updatedStep } : item,
      ),
    );
    setSaveState('saved');
  };

  return (
    <StyledPanel>
      <H2Title title={title} />
      <StyledTwoPane>
        <StyledFlow>
          <StyledTriggerNode>New lead</StyledTriggerNode>
          {items.map((email, itemIndex) => (
            <Fragment key={email.id}>
              <StyledConnector />
              <StyledEmailNode
                data-active={itemIndex === index ? 'true' : undefined}
                onClick={() => {
                  setIndex(itemIndex);
                  setSaveState('idle');
                  if (shouldFocusWorkflowNodeOnSelect) {
                    setWorkflowNodeFocusRequest({
                      nodeId: email.id,
                      requestId: Date.now(),
                    });
                  }
                }}
                type="button"
              >
                <StyledNodeName>{email.name}</StyledNodeName>
                <StyledNodeSubject>
                  {email.subject || 'No subject yet'}
                </StyledNodeSubject>
              </StyledEmailNode>
              <StyledBranchRow>
                <StyledBranch data-tone="stop">Replied - stop</StyledBranch>
                <StyledBranch data-tone="continue">
                  No reply - wait {email.delayDays}d -{' '}
                  {email.noResponseTarget === 'campaign ends'
                    ? 'campaign ends'
                    : email.noResponseTarget}
                </StyledBranch>
              </StyledBranchRow>
            </Fragment>
          ))}
        </StyledFlow>

        <StyledEditor>
          <StyledStepName>{current.name}</StyledStepName>
          <StyledSummary>
            <span>
              After this email, if the lead has <b>replied</b>, <b>stop</b>.
            </span>
            <span>
              Otherwise, wait <b>{current.delayDays} days</b>, then{' '}
              <b>
                {current.noResponseTarget === 'campaign ends'
                  ? 'the campaign ends'
                  : current.noResponseTarget}
              </b>
              .
            </span>
          </StyledSummary>
          <TextInput
            label="Subject"
            value={current.subject}
            onChange={(value) => setField('subject', value)}
            placeholder="Email subject..."
            fullWidth
          />
          <TextArea
            textAreaId={`workflow-email-template-body-${current.id}`}
            label="Message"
            value={current.body}
            onChange={(value) => setField('body', value)}
            placeholder="Write the email body..."
            minRows={12}
          />
          <StyledActions>
            <Button
              title="Previous"
              variant="secondary"
              onClick={() => {
                setIndex((currentIndex) => Math.max(0, currentIndex - 1));
                setSaveState('idle');
              }}
              disabled={index === 0}
            />
            <Button
              title="Next"
              variant="secondary"
              onClick={() => {
                setIndex((currentIndex) =>
                  Math.min(items.length - 1, currentIndex + 1),
                );
                setSaveState('idle');
              }}
              disabled={index === items.length - 1}
            />
            <StyledSpacer />
            {saveState === 'saved' && <StyledSaved>Saved</StyledSaved>}
            <Button
              title={saveState === 'saving' ? 'Saving...' : 'Save'}
              variant="primary"
              onClick={handleSave}
              disabled={saveState === 'saving'}
            />
          </StyledActions>
        </StyledEditor>
      </StyledTwoPane>
    </StyledPanel>
  );
};
