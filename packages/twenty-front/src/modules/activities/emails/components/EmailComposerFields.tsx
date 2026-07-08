import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';

import { EmailAttachmentsField } from '@/activities/emails/components/EmailAttachmentsField';
import { type EmailComposerState } from '@/activities/emails/types/EmailComposerState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { FormAdvancedTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAdvancedTextFieldInput';
import { FormMultiTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormMultiTextFieldInput';
import { GET_MY_CONNECTED_ACCOUNTS } from '@/settings/accounts/graphql/queries/getMyConnectedAccounts';
import { Select } from '@/ui/input/components/Select';
import { t } from '@lingui/core/macro';
import { useEffect, useMemo, useState } from 'react';
import {
  IconDeviceFloppy,
  IconFileText,
  IconPlus,
  IconTrash,
} from 'twenty-ui/icon';
import { Button, type SelectOption } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]};
`;

const StyledToRow = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StyledCcBccToggle = styled.button`
  all: unset;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xs};
  position: absolute;
  right: 0;
  top: 0;

  &:hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledLeadResults = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: grid;
  left: ${themeCssVariables.spacing[8]};
  max-height: 160px;
  overflow: auto;
  position: absolute;
  right: ${themeCssVariables.spacing[2]};
  top: 52px;
  z-index: 10;
`;

const StyledLeadResultButton = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  font-family: ${themeCssVariables.font.family};
  gap: 2px;
  min-height: 44px;
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledLeadName = styled.span`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLeadEmail = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTemplateSection = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTemplateControls = styled.div`
  align-items: flex-end;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr) auto auto;
`;

const StyledTemplateForm = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr) auto;
`;

const StyledTemplateNameInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: 28px;
  min-width: 0;
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:focus {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFieldLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledTextInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  height: 32px;
  outline: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 100%;

  &::placeholder {
    color: ${themeCssVariables.font.color.light};
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  &:focus {
    border-color: ${themeCssVariables.color.blue};
  }
`;

type LeadRecord = {
  __typename: string;
  id: string;
  name?: string | null;
  email?: {
    primaryEmail?: string | null;
  } | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type EmailComposerFieldsProps = {
  composerState: EmailComposerState;
};

const EMAIL_TEMPLATE_STORAGE_KEY = 'twenty-email-composer-templates';

const getStoredEmailTemplates = (): EmailTemplate[] => {
  const storedTemplates = window.localStorage.getItem(
    EMAIL_TEMPLATE_STORAGE_KEY,
  );

  if (!storedTemplates) {
    return [];
  }

  try {
    const parsedTemplates: unknown = JSON.parse(storedTemplates);

    if (!Array.isArray(parsedTemplates)) {
      return [];
    }

    return parsedTemplates.filter(
      (template): template is EmailTemplate =>
        typeof template === 'object' &&
        template !== null &&
        'id' in template &&
        'name' in template &&
        'subject' in template &&
        'body' in template &&
        typeof template.id === 'string' &&
        typeof template.name === 'string' &&
        typeof template.subject === 'string' &&
        typeof template.body === 'string',
    );
  } catch {
    return [];
  }
};

const createEmailTemplateId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const EmailComposerFields = ({
  composerState,
}: EmailComposerFieldsProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { data: accountsData } = useQuery<{
    myConnectedAccounts: { id: string; handle: string }[];
  }>(GET_MY_CONNECTED_ACCOUNTS);

  useEffect(() => {
    setTemplates(getStoredEmailTemplates());
  }, []);

  const { records: leads } = useFindManyRecords<LeadRecord>({
    objectNameSingular: 'lead',
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 200,
    recordGqlFields: {
      id: true,
      name: true,
      email: { primaryEmail: true },
    },
  });

  const accountOptions: SelectOption<string>[] =
    accountsData?.myConnectedAccounts?.map((account) => ({
      label: account.handle,
      value: account.id,
    })) ?? [];

  const hasMultipleAccounts = accountOptions.length > 1;

  const templateOptions: SelectOption<string>[] = templates.map((template) => ({
    Icon: IconFileText,
    label: template.name,
    value: template.id,
  }));

  const currentRecipientDraft = useMemo(() => {
    const recipientParts = composerState.to.split(',');
    const currentDraft = recipientParts[recipientParts.length - 1];

    return currentDraft?.trim() ?? '';
  }, [composerState.to]);

  const leadOptions = useMemo(() => {
    const search = currentRecipientDraft.toLowerCase();

    return leads
      .map((lead) => ({
        id: lead.id,
        name: lead.name?.trim() || 'Unnamed lead',
        email: lead.email?.primaryEmail?.trim() ?? '',
      }))
      .filter((lead) => lead.email.length > 0)
      .filter((lead) => {
        if (!search) {
          return false;
        }

        return `${lead.name} ${lead.email}`.toLowerCase().includes(search);
      })
      .filter((lead) => lead.email.toLowerCase() !== search)
      .slice(0, 8);
  }, [currentRecipientDraft, leads]);

  const handleLeadSelect = (email: string) => {
    composerState.completeToRecipient(email);
  };

  const storeTemplates = (nextTemplates: EmailTemplate[]) => {
    window.localStorage.setItem(
      EMAIL_TEMPLATE_STORAGE_KEY,
      JSON.stringify(nextTemplates),
    );
    setTemplates(nextTemplates);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);

    const selectedTemplate = templates.find(
      (template) => template.id === templateId,
    );

    if (!selectedTemplate) {
      return;
    }

    composerState.applyDraftTemplate({
      subject: selectedTemplate.subject,
      body: selectedTemplate.body,
    });
  };

  const handleSaveTemplate = () => {
    const trimmedTemplateName = templateName.trim();

    if (!trimmedTemplateName) {
      return;
    }

    const now = new Date().toISOString();
    const newTemplate: EmailTemplate = {
      id: createEmailTemplateId(),
      name: trimmedTemplateName,
      subject: composerState.subject,
      body: composerState.body,
      createdAt: now,
      updatedAt: now,
    };
    const nextTemplates = [...templates, newTemplate].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    storeTemplates(nextTemplates);
    setSelectedTemplateId(newTemplate.id);
    setTemplateName('');
    setIsCreatingTemplate(false);
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) {
      return;
    }

    storeTemplates(
      templates.filter((template) => template.id !== selectedTemplateId),
    );
    setSelectedTemplateId('');
  };

  return (
    <StyledFieldsContainer>
      {hasMultipleAccounts && (
        <Select
          dropdownId="email-composer-from-account"
          label={t`From`}
          fullWidth
          value={composerState.connectedAccountId}
          options={accountOptions}
          onChange={(value) => composerState.setConnectedAccountId(value)}
        />
      )}
      <StyledToRow>
        <FormMultiTextFieldInput
          key={composerState.toFieldVersion}
          label={t`To`}
          defaultValue={composerState.to}
          onChange={composerState.setTo}
          placeholder={t`Recipients`}
        />
        {!composerState.showCcBcc && (
          <StyledCcBccToggle onClick={() => composerState.setShowCcBcc(true)}>
            {t`Cc/Bcc`}
          </StyledCcBccToggle>
        )}
      </StyledToRow>
      {currentRecipientDraft.length > 0 && leadOptions.length > 0 && (
        <StyledLeadResults>
          {leadOptions.map((lead) => (
            <StyledLeadResultButton
              key={lead.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleLeadSelect(lead.email)}
            >
              <StyledLeadName>{lead.name}</StyledLeadName>
              <StyledLeadEmail>{lead.email}</StyledLeadEmail>
            </StyledLeadResultButton>
          ))}
        </StyledLeadResults>
      )}
      {composerState.showCcBcc && (
        <>
          <FormMultiTextFieldInput
            label={t`Cc`}
            defaultValue=""
            onChange={composerState.setCc}
            placeholder={t`Cc`}
          />
          <FormMultiTextFieldInput
            label={t`Bcc`}
            defaultValue=""
            onChange={composerState.setBcc}
            placeholder={t`Bcc`}
          />
        </>
      )}
      <StyledFieldContainer>
        <StyledFieldLabel>{t`Subject`}</StyledFieldLabel>
        <StyledTextInput
          value={composerState.subject}
          onChange={(event) => composerState.setSubject(event.target.value)}
          placeholder={t`Subject`}
        />
      </StyledFieldContainer>
      <StyledTemplateSection>
        <StyledTemplateControls>
          {templateOptions.length > 0 ? (
            <Select
              dropdownId="email-composer-template"
              label={t`Template`}
              fullWidth
              value={selectedTemplateId}
              emptyOption={{
                Icon: IconFileText,
                label: t`Choose template`,
                value: '',
              }}
              options={templateOptions}
              onChange={handleTemplateSelect}
            />
          ) : (
            <StyledTemplateNameInput
              aria-label={t`Template`}
              disabled
              placeholder={t`No templates saved`}
            />
          )}
          <Button
            Icon={IconPlus}
            title={t`New`}
            variant="secondary"
            size="small"
            onClick={() => setIsCreatingTemplate(true)}
          />
          <Button
            Icon={IconTrash}
            ariaLabel={t`Delete template`}
            variant="tertiary"
            accent="danger"
            size="small"
            disabled={!selectedTemplateId}
            onClick={handleDeleteTemplate}
          />
        </StyledTemplateControls>
        {isCreatingTemplate && (
          <StyledTemplateForm>
            <StyledTemplateNameInput
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder={t`Template name`}
              autoFocus
            />
            <Button
              Icon={IconDeviceFloppy}
              title={t`Save`}
              variant="primary"
              size="small"
              disabled={!templateName.trim()}
              onClick={handleSaveTemplate}
            />
          </StyledTemplateForm>
        )}
      </StyledTemplateSection>
      <FormAdvancedTextFieldInput
        key={composerState.bodyFieldVersion}
        defaultValue={composerState.body}
        onChange={composerState.setBody}
        placeholder={t`Type something or press "/" to see commands`}
        minHeight={120}
        maxWidth={600}
        contentType="html"
      />
      <EmailAttachmentsField
        label={t`Attachments`}
        files={composerState.files}
        onChange={composerState.setFiles}
      />
    </StyledFieldsContainer>
  );
};
