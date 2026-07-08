import gql from 'graphql-tag';

export const EMAIL_MESSAGE_ACTION = gql`
  mutation EmailMessageAction($input: EmailMessageActionInput!) {
    emailMessageAction(input: $input) {
      success
      error
    }
  }
`;
