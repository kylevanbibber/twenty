import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { type WorkflowVersion } from '@/workflow/types/Workflow';
import {
  hasWorkflowEmailActions,
  WorkflowEmailTemplatesPanel,
} from '@/workflow/workflow-email-templates/components/WorkflowEmailTemplatesPanel';

const CAMPAIGN_NAME = 'Drip Email Campaign';

const GET_DRIP_CAMPAIGN = gql`
  query DripCampaignTemplates($name: String!) {
    workflows(filter: { name: { eq: $name } }) {
      edges {
        node {
          id
          name
          versions {
            edges {
              node {
                id
                name
                createdAt
                updatedAt
                workflowId
                trigger
                status
                steps
                __typename
              }
            }
          }
        }
      }
    }
  }
`;

const StyledPage = styled.div`
  height: 100%;
  overflow: hidden;
`;

const StyledMessage = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[4]};
`;

type DripCampaignTemplatesQuery = {
  workflows?: {
    edges?: Array<{
      node?: {
        id: string;
        name: string;
        versions?: {
          edges?: Array<{
            node: WorkflowVersion;
          }>;
        };
      };
    }>;
  };
};

export const CampaignTemplatesPage = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, loading, error } = useQuery<DripCampaignTemplatesQuery>(
    GET_DRIP_CAMPAIGN,
    {
      client: apolloCoreClient,
      variables: { name: CAMPAIGN_NAME },
      fetchPolicy: 'network-only',
    },
  );

  const workflow = data?.workflows?.edges?.[0]?.node;
  const versions =
    workflow?.versions?.edges?.map(
      (edge: { node: WorkflowVersion }) => edge.node,
    ) ?? [];
  const workflowVersion =
    versions.find((version: WorkflowVersion) => version.status === 'DRAFT') ??
    versions[0];

  if (loading) {
    return <StyledMessage>Loading...</StyledMessage>;
  }

  if (error) {
    return (
      <StyledMessage>Couldn't load the campaign: {error.message}</StyledMessage>
    );
  }

  if (!workflowVersion || !hasWorkflowEmailActions(workflowVersion)) {
    return (
      <StyledMessage>
        No editable email steps found. Make sure the "{CAMPAIGN_NAME}" workflow
        has a draft version.
      </StyledMessage>
    );
  }

  return (
    <StyledPage>
      <WorkflowEmailTemplatesPanel
        title={`${CAMPAIGN_NAME} - Email templates`}
        workflowVersion={workflowVersion}
      />
    </StyledPage>
  );
};
