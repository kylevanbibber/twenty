import { useFirstConnectedAccount } from '@/activities/emails/hooks/useFirstConnectedAccount';
import { useEmailMessageAction } from '@/activities/emails/hooks/useEmailMessageAction';
import { useEmailThread } from '@/activities/emails/hooks/useEmailThread';
import { type EmailThreadMessageParticipant } from '@/activities/emails/types/EmailThreadMessageParticipant';
import { type EmailThreadMessageWithSender } from '@/activities/emails/types/EmailThreadMessageWithSender';
import { formatEmailMessageText } from '@/activities/emails/utils/formatEmailMessageText';
import { type CalendarEvent } from '@/activities/calendar/types/CalendarEvent';
import { type MessageFolder } from '@/accounts/types/MessageFolder';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useMyMessageFolders } from '@/settings/accounts/hooks/useMyMessageFolders';
import { useOpenComposeEmailInSidePanel } from '@/side-panel/hooks/useOpenComposeEmailInSidePanel';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  CoreObjectNameSingular,
  MessageParticipantRole,
  SettingsPath,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconAlertTriangle,
  IconArchive,
  IconArrowBackUp,
  IconCalendarEvent,
  IconFilePencil,
  IconFolder,
  IconInbox,
  IconMail,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSend,
  IconTrash,
  IconVideo,
} from 'twenty-ui/icon';
import { MainButton } from 'twenty-ui/input';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { v4 } from 'uuid';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

type EmailMessageRecord = {
  id: string;
  subject: string;
  text: string;
  receivedAt: string;
  direction?: string | null;
  messageThreadId: string;
  messageParticipants?: EmailThreadMessageParticipant[];
  __typename: string;
};

type EmailMessageAssociationRecord = {
  __typename: string;
  id: string;
  messageId: string;
  messageChannelId: string;
  messageThreadExternalId?: string | null;
  messageExternalId?: string | null;
  message?: EmailMessageRecord | null;
  messageFolders?: Array<{
    id: string;
    messageFolderId: string;
  }>;
};

type CalendarEventRecord = CalendarEvent & {
  calendarEventParticipants?: CalendarEvent['calendarEventParticipants'];
};

type CommunicationTab = 'email' | 'calendar';
type MailFolder = 'inbox' | 'sent' | 'drafts' | 'junk' | 'trash';
type CalendarView = 'day' | 'week' | 'month';

const MAIL_FOLDERS = [
  { key: 'inbox', label: 'Inbox', Icon: IconInbox },
  { key: 'sent', label: 'Sent', Icon: IconSend },
  { key: 'drafts', label: 'Drafts', Icon: IconFilePencil },
  { key: 'junk', label: 'Junk', Icon: IconAlertTriangle },
  { key: 'trash', label: 'Trash', Icon: IconTrash },
] satisfies Array<{
  key: MailFolder;
  label: string;
  Icon: typeof IconInbox;
}>;

const MOVE_TARGETS = [
  { label: 'Inbox', labelId: 'INBOX' },
  { label: 'Sent', labelId: 'SENT' },
  { label: 'Junk', labelId: 'SPAM' },
  { label: 'Trash', labelId: 'TRASH' },
];

const MAIL_FOLDER_EXTERNAL_IDS: Record<MailFolder, string[]> = {
  inbox: ['INBOX'],
  sent: ['SENT'],
  drafts: ['DRAFT'],
  junk: ['SPAM'],
  trash: ['TRASH'],
};

const CALENDAR_VIEWS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
] satisfies Array<{ key: CalendarView; label: string }>;

const StyledPage = styled.div`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  min-height: 56px;
  padding: 0 ${themeCssVariables.spacing[6]};
`;

const StyledTitleCluster = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1;
  margin: 0;
`;

const StyledRail = styled.aside`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
  width: 184px;
`;

const StyledRailAction = styled.div`
  box-sizing: border-box;
  margin-bottom: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledRailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledRailButton = styled.button<{ active: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;
`;

const StyledRailSubButton = styled(StyledRailButton)`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
  height: 30px;
  padding-left: ${themeCssVariables.spacing[5]};
`;

const StyledRailDivider = styled.div`
  background: ${themeCssVariables.border.color.light};
  height: 1px;
  margin: ${themeCssVariables.spacing[2]} 0;
  width: 100%;
`;

const StyledSearch = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  min-width: 260px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
  outline: 0;
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
`;

const StyledMain = styled.main`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
`;

const StyledListPane = styled.section`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex: 0 0 360px;
  flex-direction: column;
  min-height: 0;
`;

const StyledPaneHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  height: 44px;
  justify-content: space-between;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledPaneTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSegmentedControl = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-shrink: 0;
  gap: 2px;
  height: 32px;
  padding: 2px;
`;

const StyledSegmentedButton = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active ? themeCssVariables.background.primary : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${({ active }) =>
    active
      ? themeCssVariables.font.weight.medium
      : themeCssVariables.font.weight.regular};
  height: 26px;
  min-width: 56px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledScrollable = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
`;

const StyledThreadRow = styled.button<{ active?: boolean }>`
  background: ${({ active }) =>
    active ? themeCssVariables.background.transparent.light : 'transparent'};
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;
`;

const StyledRowMeta = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledRowTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledRowBody = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDetailPane = styled.section`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
`;

const StyledDetailHeader = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 72px;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
`;

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToolbarButton = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  height: 28px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:disabled {
    color: ${themeCssVariables.font.color.light};
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledToolbarSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  height: 28px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledDetailTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
  overflow-wrap: anywhere;
`;

const StyledMessage = styled.article`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
`;

const StyledMessageBody = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  padding: ${themeCssVariables.spacing[8]};
  text-align: center;
`;

const StyledCalendarPane = styled.div`
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-width: 0;
`;

const StyledCalendarGrid = styled.div<{ view: CalendarView }>`
  display: grid;
  grid-auto-rows: ${({ view }) =>
    view === 'month' ? 'minmax(148px, 1fr)' : 'minmax(0, 1fr)'};
  grid-template-columns: ${({ view }) =>
    view === 'day' ? 'minmax(280px, 1fr)' : 'repeat(7, minmax(120px, 1fr))'};
  min-width: 0;
  overflow: auto;
`;

const StyledDayColumn = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const StyledDayHeader = styled.div<{ active?: boolean }>`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${({ active }) =>
    active
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.secondary};
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  height: 64px;
  justify-items: center;
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledDayNumber = styled.span<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active ? themeCssVariables.color.blue : 'transparent'};
  border-radius: 999px;
  color: ${({ active }) =>
    active
      ? themeCssVariables.grayScale.gray1
      : themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledEventPill = styled.button`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  height: 70px;
  margin: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: calc(100% - ${themeCssVariables.spacing[4]});
`;

const StyledEventTitle = styled.span`
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledEventMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledAgenda = styled.aside`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const formatDateTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = parseISO(value);

  if (!isValid(date)) {
    return '';
  }

  return format(date, 'MMM d, h:mm a');
};

const formatTime = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = parseISO(value);

  if (!isValid(date)) {
    return '';
  }

  return format(date, 'h:mm a');
};

const getPlainText = (value?: string) =>
  formatEmailMessageText(value).replace(/\s+/g, ' ').trim();

const getSenderLabel = (
  participants: EmailThreadMessageParticipant[] | undefined,
) => {
  const sender = participants?.find(
    (participant) => participant.role === MessageParticipantRole.FROM,
  );

  return sender?.displayName || sender?.handle || 'Unknown sender';
};

const uniqueHandles = (handles: string[]) =>
  Array.from(new Set(handles.map((handle) => handle.trim()).filter(Boolean)));

const getReplyAllRecipients = ({
  lastMessage,
  connectedAccountHandle,
}: {
  lastMessage: EmailThreadMessageWithSender | undefined;
  connectedAccountHandle: string | null;
}) => {
  if (!lastMessage) {
    return { to: '', cc: '' };
  }

  const ownHandle = connectedAccountHandle?.toLowerCase();
  const participants = lastMessage.messageParticipants ?? [];
  const isNotOwnHandle = (handle: string) =>
    handle.trim().length > 0 && handle.toLowerCase() !== ownHandle;

  const to = uniqueHandles([
    lastMessage.sender.handle,
    ...participants
      .filter((participant) => participant.role === MessageParticipantRole.TO)
      .map((participant) => participant.handle),
  ]).filter(isNotOwnHandle);

  const cc = uniqueHandles(
    participants
      .filter((participant) => participant.role === MessageParticipantRole.CC)
      .map((participant) => participant.handle),
  ).filter(isNotOwnHandle);

  return {
    to: to.join(', '),
    cc: cc.join(', '),
  };
};

const getForwardBody = (message: EmailThreadMessageWithSender | undefined) => {
  if (!message) {
    return '';
  }

  return [
    '',
    '',
    '---------- Forwarded message ----------',
    `From: ${message.sender.displayName} <${message.sender.handle}>`,
    `Date: ${formatDateTime(message.receivedAt)}`,
    `Subject: ${message.subject ?? ''}`,
    '',
    getPlainText(message.text),
  ].join('\n');
};

const getFolderIdsForMailFolder = (
  messageFolders: MessageFolder[],
  mailFolder: MailFolder,
) => {
  const externalIds = MAIL_FOLDER_EXTERNAL_IDS[mailFolder];

  return new Set(
    messageFolders
      .filter(
        (folder) =>
          externalIds.includes(folder.externalId ?? '') ||
          (mailFolder === 'sent' && folder.isSentFolder),
      )
      .map((folder) => folder.id),
  );
};

const isMessageSentByConnectedAccount = (
  message: EmailMessageRecord,
  connectedAccountHandle: string | null,
) => {
  if (message.direction === 'OUTGOING') {
    return true;
  }

  if (!connectedAccountHandle) {
    return false;
  }

  return (
    message.messageParticipants?.some(
      (participant) =>
        participant.role === MessageParticipantRole.FROM &&
        participant.handle.toLowerCase() ===
          connectedAccountHandle.toLowerCase(),
    ) ?? false
  );
};

export const CommunicationsPage = () => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState<CommunicationTab>('email');
  const [activeMailFolder, setActiveMailFolder] = useState<MailFolder>('inbox');
  const [activeCalendarView, setActiveCalendarView] =
    useState<CalendarView>('week');
  const [searchValue, setSearchValue] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { openComposeEmailInSidePanel } = useOpenComposeEmailInSidePanel();
  const { runEmailMessageAction, loading: emailActionLoading } =
    useEmailMessageAction();
  const navigateSettings = useNavigateSettings();
  const {
    connectedAccountId,
    connectedAccountHandle,
    loading: connectedAccountLoading,
  } = useFirstConnectedAccount();
  const { messageFolders, loading: messageFoldersLoading } =
    useMyMessageFolders();
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = useMemo(
    () => startOfWeek(today, { weekStartsOn: 1 }),
    [today],
  );
  const calendarWindowEnd = useMemo(() => addDays(weekStart, 90), [weekStart]);

  const {
    records: messageAssociations,
    loading: messageAssociationsLoading,
    refetch: refetchMessageAssociations,
  } = useFindManyRecords<EmailMessageAssociationRecord>({
    objectNameSingular: CoreObjectNameSingular.MessageChannelMessageAssociation,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: 2000,
    recordGqlFields: {
      id: true,
      messageId: true,
      messageChannelId: true,
      messageThreadExternalId: true,
      messageExternalId: true,
      message: {
        id: true,
        subject: true,
        text: true,
        receivedAt: true,
        direction: true,
        messageThreadId: true,
        messageParticipants: {
          id: true,
          role: true,
          displayName: true,
          handle: true,
          messageId: true,
          person: true,
          workspaceMember: true,
        },
      },
      messageFolders: {
        id: true,
        messageFolderId: true,
      },
    },
  });

  const {
    records: messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useFindManyRecords<EmailMessageRecord>({
    objectNameSingular: CoreObjectNameSingular.Message,
    orderBy: [{ receivedAt: 'DescNullsLast' }],
    limit: 2000,
    recordGqlFields: {
      id: true,
      subject: true,
      text: true,
      receivedAt: true,
      direction: true,
      messageThreadId: true,
      messageParticipants: {
        id: true,
        role: true,
        displayName: true,
        handle: true,
        messageId: true,
        person: true,
        workspaceMember: true,
      },
    },
  });

  const {
    records: calendarEvents,
    loading: calendarEventsLoading,
    refetch: refetchCalendarEvents,
  } = useFindManyRecords<CalendarEventRecord>({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
    filter: {
      and: [
        { startsAt: { gte: weekStart.toISOString() } },
        { startsAt: { lte: calendarWindowEnd.toISOString() } },
      ],
    },
    orderBy: [{ startsAt: 'AscNullsLast' }],
    limit: 250,
    recordGqlFields: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      isFullDay: true,
      isCanceled: true,
      location: true,
      conferenceLink: true,
      calendarEventParticipants: {
        id: true,
        handle: true,
        displayName: true,
        responseStatus: true,
        person: true,
        workspaceMember: true,
      },
    },
  });

  const threadSummaries = useMemo(() => {
    const threadsById = new Map<string, EmailMessageRecord>();
    const folderIdsForActiveFolder = getFolderIdsForMailFolder(
      messageFolders,
      activeMailFolder,
    );
    const addMessageToThreads = (message: EmailMessageRecord) => {
      if (!isDefined(message.messageThreadId)) {
        return;
      }

      if (!threadsById.has(message.messageThreadId)) {
        threadsById.set(message.messageThreadId, message);
      }
    };

    for (const association of messageAssociations) {
      const message = association.message;

      if (!message) {
        continue;
      }

      const isMessageInActiveFolder =
        folderIdsForActiveFolder.size > 0 &&
        (association.messageFolders ?? []).some((messageFolder) =>
          folderIdsForActiveFolder.has(messageFolder.messageFolderId),
        );

      const isFolderlessSentMessage =
        activeMailFolder === 'sent' &&
        isMessageSentByConnectedAccount(message, connectedAccountHandle);

      if (!isMessageInActiveFolder && !isFolderlessSentMessage) {
        continue;
      }

      addMessageToThreads(message);
    }

    if (activeMailFolder === 'sent') {
      for (const message of messages) {
        if (!isMessageSentByConnectedAccount(message, connectedAccountHandle)) {
          continue;
        }

        addMessageToThreads(message);
      }
    }

    return Array.from(threadsById.values()).filter((message) => {
      const search = searchValue.toLowerCase();

      if (!search) {
        return true;
      }

      return [
        message.subject,
        getPlainText(message.text),
        getSenderLabel(message.messageParticipants),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [
    activeMailFolder,
    connectedAccountHandle,
    messageAssociations,
    messageFolders,
    messages,
    searchValue,
  ]);

  const displayedThreadSummaries = useMemo(
    () =>
      [...threadSummaries].sort(
        (firstThread, secondThread) =>
          Date.parse(secondThread.receivedAt ?? '') -
          Date.parse(firstThread.receivedAt ?? ''),
      ),
    [threadSummaries],
  );

  useEffect(() => {
    const selectedThreadStillVisible = displayedThreadSummaries.some(
      (thread) => thread.messageThreadId === selectedThreadId,
    );

    if (!selectedThreadStillVisible && displayedThreadSummaries.length > 0) {
      setSelectedThreadId(displayedThreadSummaries[0].messageThreadId);
    } else if (!selectedThreadStillVisible) {
      setSelectedThreadId(null);
    }
  }, [activeMailFolder, displayedThreadSummaries, selectedThreadId]);

  const selectedThreadSummary = displayedThreadSummaries.find(
    (thread) => thread.messageThreadId === selectedThreadId,
  );

  const {
    messages: selectedThreadMessages,
    threadLoading,
    connectedAccountId: selectedThreadConnectedAccountId,
    connectedAccountHandle: selectedThreadConnectedAccountHandle,
    lastMessageExternalId,
    messageThreadExternalId,
  } = useEmailThread(selectedThreadId);

  const visibleCalendarDays = useMemo(() => {
    if (activeCalendarView === 'day') {
      return [today];
    }

    if (activeCalendarView === 'month') {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(today), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(today), { weekStartsOn: 1 }),
      });
    }

    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [activeCalendarView, today, weekStart]);

  const visibleCalendarStart = visibleCalendarDays[0];
  const visibleCalendarEnd =
    visibleCalendarDays[visibleCalendarDays.length - 1];

  const filteredCalendarEvents = useMemo(() => {
    const search = searchValue.toLowerCase();
    const visibleStartTime = visibleCalendarStart.getTime();
    const visibleEndTime = addDays(visibleCalendarEnd, 1).getTime();

    return calendarEvents.filter((event) => {
      const eventStartTime = parseISO(event.startsAt).getTime();

      if (
        !Number.isFinite(eventStartTime) ||
        eventStartTime < visibleStartTime ||
        eventStartTime >= visibleEndTime
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [event.title, event.location]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [calendarEvents, searchValue, visibleCalendarEnd, visibleCalendarStart]);

  const handleRefresh = () => {
    if (activeTab === 'email') {
      void refetchMessageAssociations();
      void refetchMessages();
    } else {
      void refetchCalendarEvents();
    }
  };

  const handleCompose = () => {
    if (!connectedAccountId) {
      navigateSettings(SettingsPath.NewAccount);

      return;
    }

    openComposeEmailInSidePanel({
      connectedAccountId,
    });
  };

  const handleCreateCalendarEvent = () => {
    openRecordInSidePanel({
      recordId: v4(),
      objectNameSingular: CoreObjectNameSingular.CalendarEvent,
      isNewRecord: true,
    });
  };

  const lastThreadMessage =
    selectedThreadMessages[selectedThreadMessages.length - 1];

  const canActOnSelectedThread =
    !!selectedThreadConnectedAccountId &&
    (!!messageThreadExternalId || !!lastMessageExternalId);

  const handleReply = () => {
    if (
      !isDefined(lastThreadMessage) ||
      !isDefined(selectedThreadConnectedAccountId)
    ) {
      return;
    }

    openComposeEmailInSidePanel({
      threadId: selectedThreadId ?? undefined,
      connectedAccountId: selectedThreadConnectedAccountId,
      defaultTo: lastThreadMessage.sender.handle,
      defaultSubject: lastThreadMessage.subject?.startsWith('Re: ')
        ? lastThreadMessage.subject
        : `Re: ${lastThreadMessage.subject ?? ''}`,
      defaultInReplyTo: lastThreadMessage.headerMessageId,
    });
  };

  const handleReplyAll = () => {
    if (
      !isDefined(lastThreadMessage) ||
      !isDefined(selectedThreadConnectedAccountId)
    ) {
      return;
    }

    const { to, cc } = getReplyAllRecipients({
      lastMessage: lastThreadMessage,
      connectedAccountHandle: selectedThreadConnectedAccountHandle,
    });

    openComposeEmailInSidePanel({
      threadId: selectedThreadId ?? undefined,
      connectedAccountId: selectedThreadConnectedAccountId,
      defaultTo: to || lastThreadMessage.sender.handle,
      defaultCc: cc,
      defaultSubject: lastThreadMessage.subject?.startsWith('Re: ')
        ? lastThreadMessage.subject
        : `Re: ${lastThreadMessage.subject ?? ''}`,
      defaultInReplyTo: lastThreadMessage.headerMessageId,
    });
  };

  const handleForward = () => {
    if (
      !isDefined(lastThreadMessage) ||
      !isDefined(selectedThreadConnectedAccountId)
    ) {
      return;
    }

    openComposeEmailInSidePanel({
      connectedAccountId: selectedThreadConnectedAccountId,
      defaultSubject: lastThreadMessage.subject?.startsWith('Fwd: ')
        ? lastThreadMessage.subject
        : `Fwd: ${lastThreadMessage.subject ?? ''}`,
      defaultBody: getForwardBody(lastThreadMessage),
    });
  };

  const runSelectedThreadAction = async (
    action: 'ARCHIVE' | 'TRASH' | 'DELETE' | 'MOVE',
    targetLabelId?: string,
  ) => {
    if (!selectedThreadConnectedAccountId) {
      return;
    }

    const success = await runEmailMessageAction({
      connectedAccountId: selectedThreadConnectedAccountId,
      threadExternalId: messageThreadExternalId,
      messageExternalId: lastMessageExternalId,
      action,
      targetLabelId,
    });

    if (success) {
      setSelectedThreadId(null);
      void refetchMessageAssociations();
    }
  };

  const activeMailFolderLabel =
    MAIL_FOLDERS.find((folder) => folder.key === activeMailFolder)?.label ??
    'Inbox';
  const mailLoading = messageAssociationsLoading || messageFoldersLoading;
  const emailListLoading = mailLoading || messagesLoading;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledTitleCluster>
          <StyledTitle>Email & Calendar</StyledTitle>
        </StyledTitleCluster>
        <StyledTitleCluster>
          {activeTab === 'calendar' && (
            <StyledSegmentedControl>
              {CALENDAR_VIEWS.map((view) => (
                <StyledSegmentedButton
                  active={activeCalendarView === view.key}
                  key={view.key}
                  onClick={() => setActiveCalendarView(view.key)}
                  type="button"
                >
                  {view.label}
                </StyledSegmentedButton>
              ))}
            </StyledSegmentedControl>
          )}
          <StyledSearch>
            <IconSearch size={theme.icon.size.sm} />
            <StyledSearchInput
              aria-label="Search"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search"
              value={searchValue}
            />
          </StyledSearch>
          <StyledIconButton
            aria-label="Refresh"
            onClick={handleRefresh}
            type="button"
          >
            <IconRefresh size={theme.icon.size.md} />
          </StyledIconButton>
        </StyledTitleCluster>
      </StyledHeader>
      <StyledContent>
        <StyledRail>
          <StyledRailAction>
            <MainButton
              Icon={activeTab === 'email' ? IconMail : IconPlus}
              disabled={activeTab === 'email' && connectedAccountLoading}
              fullWidth
              onClick={
                activeTab === 'email'
                  ? handleCompose
                  : handleCreateCalendarEvent
              }
              title={activeTab === 'email' ? 'Compose' : 'Create'}
            />
          </StyledRailAction>
          <StyledRailSection>
            {MAIL_FOLDERS.map(({ key, label, Icon }) => (
              <StyledRailSubButton
                active={activeTab === 'email' && activeMailFolder === key}
                key={key}
                onClick={() => {
                  setActiveTab('email');
                  setActiveMailFolder(key);
                }}
                type="button"
              >
                <Icon size={theme.icon.size.sm} />
                {label}
              </StyledRailSubButton>
            ))}
          </StyledRailSection>
          <StyledRailDivider />
          <StyledRailButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            type="button"
          >
            <IconCalendarEvent size={theme.icon.size.sm} />
            Schedule
          </StyledRailButton>
        </StyledRail>
        {activeTab === 'email' ? (
          <StyledMain>
            <StyledListPane>
              <StyledPaneHeader>
                <StyledPaneTitle>{activeMailFolderLabel}</StyledPaneTitle>
                <StyledEventMeta>
                  {emailListLoading
                    ? 'Syncing'
                    : `${displayedThreadSummaries.length}`}
                </StyledEventMeta>
              </StyledPaneHeader>
              <StyledScrollable>
                {displayedThreadSummaries.map((thread) => (
                  <StyledThreadRow
                    active={thread.messageThreadId === selectedThreadId}
                    key={thread.messageThreadId}
                    onClick={() => setSelectedThreadId(thread.messageThreadId)}
                    type="button"
                  >
                    <StyledRowMeta>
                      <span>{getSenderLabel(thread.messageParticipants)}</span>
                      <span>{formatDateTime(thread.receivedAt)}</span>
                    </StyledRowMeta>
                    <StyledRowTitle>
                      {thread.subject || '(no subject)'}
                    </StyledRowTitle>
                    <StyledRowBody>{getPlainText(thread.text)}</StyledRowBody>
                  </StyledThreadRow>
                ))}
                {!emailListLoading && displayedThreadSummaries.length === 0 && (
                  <StyledEmptyState>
                    No synced {activeMailFolderLabel.toLowerCase()} mail yet.
                  </StyledEmptyState>
                )}
              </StyledScrollable>
            </StyledListPane>
            <StyledDetailPane>
              {selectedThreadSummary ? (
                <>
                  <StyledDetailHeader>
                    <StyledDetailTitle>
                      {selectedThreadSummary.subject || '(no subject)'}
                    </StyledDetailTitle>
                    <StyledRowMeta>
                      <span>
                        {getSenderLabel(
                          selectedThreadSummary.messageParticipants,
                        )}
                      </span>
                      <span>
                        {formatDateTime(selectedThreadSummary.receivedAt)}
                      </span>
                      <StyledIconButton
                        aria-label="Open thread"
                        onClick={() =>
                          openRecordInSidePanel({
                            recordId: selectedThreadSummary.messageThreadId,
                            objectNameSingular:
                              CoreObjectNameSingular.MessageThread,
                          })
                        }
                        type="button"
                      >
                        <IconMail size={theme.icon.size.md} />
                      </StyledIconButton>
                    </StyledRowMeta>
                    <StyledToolbar>
                      <StyledToolbarButton
                        disabled={!isDefined(lastThreadMessage)}
                        onClick={handleReply}
                        type="button"
                      >
                        <IconArrowBackUp size={theme.icon.size.sm} />
                        Reply
                      </StyledToolbarButton>
                      <StyledToolbarButton
                        disabled={!isDefined(lastThreadMessage)}
                        onClick={handleReplyAll}
                        type="button"
                      >
                        <IconArrowBackUp size={theme.icon.size.sm} />
                        Reply all
                      </StyledToolbarButton>
                      <StyledToolbarButton
                        disabled={!isDefined(lastThreadMessage)}
                        onClick={handleForward}
                        type="button"
                      >
                        <IconSend size={theme.icon.size.sm} />
                        Forward
                      </StyledToolbarButton>
                      <StyledToolbarButton
                        disabled={!canActOnSelectedThread || emailActionLoading}
                        onClick={() => void runSelectedThreadAction('ARCHIVE')}
                        type="button"
                      >
                        <IconArchive size={theme.icon.size.sm} />
                        Archive
                      </StyledToolbarButton>
                      <StyledToolbarButton
                        disabled={!canActOnSelectedThread || emailActionLoading}
                        onClick={() => void runSelectedThreadAction('TRASH')}
                        type="button"
                      >
                        <IconTrash size={theme.icon.size.sm} />
                        Delete
                      </StyledToolbarButton>
                      <IconFolder size={theme.icon.size.sm} />
                      <StyledToolbarSelect
                        disabled={!canActOnSelectedThread || emailActionLoading}
                        onChange={(event) => {
                          const targetLabelId = event.target.value;

                          if (!targetLabelId) {
                            return;
                          }

                          void runSelectedThreadAction('MOVE', targetLabelId);
                          event.target.value = '';
                        }}
                        value=""
                      >
                        <option value="">Move</option>
                        {MOVE_TARGETS.map((target) => (
                          <option key={target.labelId} value={target.labelId}>
                            {target.label}
                          </option>
                        ))}
                      </StyledToolbarSelect>
                    </StyledToolbar>
                  </StyledDetailHeader>
                  <StyledScrollable>
                    {threadLoading && (
                      <StyledEmptyState>Loading thread...</StyledEmptyState>
                    )}
                    {!threadLoading &&
                      selectedThreadMessages.map((message) => (
                        <StyledMessage key={message.id}>
                          <StyledRowMeta>
                            <strong>{message.sender.displayName}</strong>
                            <span>{formatDateTime(message.receivedAt)}</span>
                          </StyledRowMeta>
                          <StyledMessageBody>
                            {formatEmailMessageText(message.text)}
                          </StyledMessageBody>
                        </StyledMessage>
                      ))}
                  </StyledScrollable>
                </>
              ) : (
                <StyledEmptyState>Select a thread.</StyledEmptyState>
              )}
            </StyledDetailPane>
          </StyledMain>
        ) : (
          <StyledMain>
            <StyledCalendarPane>
              <StyledCalendarGrid view={activeCalendarView}>
                {visibleCalendarDays.map((day) => {
                  const eventsForDay = filteredCalendarEvents.filter((event) =>
                    isSameDay(parseISO(event.startsAt), day),
                  );

                  return (
                    <StyledDayColumn key={day.toISOString()}>
                      <StyledDayHeader active={isToday(day)}>
                        <span>{format(day, 'EEE')}</span>
                        <StyledDayNumber active={isToday(day)}>
                          {format(day, 'd')}
                        </StyledDayNumber>
                      </StyledDayHeader>
                      <StyledScrollable>
                        {eventsForDay.map((event) => (
                          <StyledEventPill
                            key={event.id}
                            onClick={() =>
                              openRecordInSidePanel({
                                recordId: event.id,
                                objectNameSingular:
                                  CoreObjectNameSingular.CalendarEvent,
                              })
                            }
                            type="button"
                          >
                            <StyledEventTitle>
                              {event.title || '(no title)'}
                            </StyledEventTitle>
                            <StyledEventMeta>
                              {event.isFullDay
                                ? 'All day'
                                : `${formatTime(event.startsAt)} - ${formatTime(
                                    event.endsAt,
                                  )}`}
                            </StyledEventMeta>
                            {event.conferenceLink?.primaryLinkUrl && (
                              <StyledRowMeta>
                                <IconVideo size={theme.icon.size.sm} />
                                Meet
                              </StyledRowMeta>
                            )}
                          </StyledEventPill>
                        ))}
                      </StyledScrollable>
                    </StyledDayColumn>
                  );
                })}
              </StyledCalendarGrid>
              <StyledAgenda>
                <StyledPaneHeader>
                  <StyledPaneTitle>Agenda</StyledPaneTitle>
                  <StyledEventMeta>
                    {calendarEventsLoading
                      ? 'Syncing'
                      : filteredCalendarEvents.length}
                  </StyledEventMeta>
                </StyledPaneHeader>
                <StyledScrollable>
                  {filteredCalendarEvents.map((event) => (
                    <StyledThreadRow
                      key={event.id}
                      onClick={() =>
                        openRecordInSidePanel({
                          recordId: event.id,
                          objectNameSingular:
                            CoreObjectNameSingular.CalendarEvent,
                        })
                      }
                      type="button"
                    >
                      <StyledRowTitle>
                        {event.title || '(no title)'}
                      </StyledRowTitle>
                      <StyledRowMeta>
                        <span>{formatDateTime(event.startsAt)}</span>
                        {event.calendarEventParticipants?.length ? (
                          <span>
                            {event.calendarEventParticipants.length} guests
                          </span>
                        ) : null}
                      </StyledRowMeta>
                      {event.location && (
                        <StyledRowBody>{event.location}</StyledRowBody>
                      )}
                    </StyledThreadRow>
                  ))}
                  {!calendarEventsLoading &&
                    filteredCalendarEvents.length === 0 && (
                      <StyledEmptyState>
                        No synced calendar events yet.
                      </StyledEmptyState>
                    )}
                </StyledScrollable>
              </StyledAgenda>
            </StyledCalendarPane>
          </StyledMain>
        )}
      </StyledContent>
    </StyledPage>
  );
};
