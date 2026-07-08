# R3 CRM — Feature Notes & Handoff

> Working document for the R3 fork of [Twenty CRM](https://github.com/twentyhq/twenty).
> Orients a collaborator on what custom functionality has been built on top of upstream
> Twenty, where it lives, and how it works. For base-app setup and conventions see
> [CLAUDE.md](CLAUDE.md) and [README.md](README.md).

---

## Running locally (quick reference)

This fork runs on **custom ports** to avoid clashing with other local apps:

- **Backend (twenty-server):** `http://localhost:3010` (`NODE_PORT=3010`)
- **Frontend (twenty-front):** `http://localhost:3011` (`REACT_APP_PORT=3011`)

Setup (idempotent — starts Postgres/Redis, creates DBs, runs migrations):

```bash
bash packages/twenty-utils/setup-dev-env.sh
yarn start          # front + back + worker
```

Local Postgres/Redis via Homebrew (no Docker), Node 24 (`.nvmrc`). The dev DB is
`r3_live_local`. Log in with your own workspace account (the `tim@apple.dev` prefill is a
generic dev default and does not exist in this workspace).

---

## RecordTable enhancements (custom)

The features below are **our custom additions** to the **RecordTable** (the main record grid
in `packages/twenty-front/src/modules/object-record/`). Each reuses existing Twenty primitives
rather than introducing parallel systems. (The Email/Calendar integration further down is core
Twenty, documented separately.)

### 1. Inline bulk field-edit

**What it does.** With **more than one row selected**, opening a column's header dropdown
shows **“Set value for N selected”**. Choosing it swaps the dropdown to that field's input;
picking a value applies it to **every selected record** at once (optimistic, batched).

**How to use.** Select 2+ rows via the row checkboxes → open a column header menu on an
editable field → *Set value for N selected* → pick/enter a value → *Apply*.

**Gating (all reused from Twenty).** Shown only when: `selectedRowIds.length > 1`,
`objectPermissions.canUpdateObjectRecords`, the field passes
`shouldDisplayFormMultiEditField` (excludes read-only / system / unique / non-`MANY_TO_ONE`
relation fields), and the table's column headers aren't in read-only mode.

**Where it lives.**
- [RecordTableColumnHeadDropdownMenu.tsx](packages/twenty-front/src/modules/object-record/record-table/record-table-header/components/RecordTableColumnHeadDropdownMenu.tsx) — the menu item + content swap.
- [InlineBulkEditFieldContent.tsx](packages/twenty-front/src/modules/object-record/record-update-multiple/components/InlineBulkEditFieldContent.tsx) — renders `FormFieldInput` + Apply/Cancel.
- [useApplyInlineBulkFieldEdit.ts](packages/twenty-front/src/modules/object-record/record-update-multiple/hooks/useApplyInlineBulkFieldEdit.ts) — reads selected row IDs, persists via `useUpdateManyRecords`.
- [getMultiEditUpdateInput.ts](packages/twenty-front/src/modules/object-record/record-update-multiple/utils/getMultiEditUpdateInput.ts) — shared field-name / value normalization (also used by the side-panel multi-edit form).

**Notes.** Persistence uses `useUpdateManyRecords` (optimistic cache + record-store upsert,
reverts on error, batches by the API's max-affected-records). No confirmation modal on
apply — the Apply button is the explicit step.

### 2. Excel-style Select column filter (Select-all / Clear-all)

**What it does.** The Select / MultiSelect column filter is a searchable checklist of the
field's options (this already existed in Twenty). We added a **Select all / Clear all**
toggle at the top of the list.

**How it works.** It rides entirely on Twenty's existing **server-side** record-filter
pipeline — a Select `IS` filter compiles to `{ fieldName: { in: [...] } }`, so results stay
correct across pagination/virtualization (unlike a client-side unique-value approach). The
toggle just applies the full (search-filtered) option set or an empty value through the same
`applyObjectFilterDropdownFilterValue` path a single toggle uses.

**Where it lives.**
- [ObjectFilterDropdownOptionSelect.tsx](packages/twenty-front/src/modules/object-record/object-filter-dropdown/components/ObjectFilterDropdownOptionSelect.tsx)

**Scope.** Select / MultiSelect columns only (their values are enumerable from field
metadata). Text/Relation/Number columns keep their existing operator-based filter inputs — a
unique-value checklist for those would need a new backend distinct-values resolver.

### 3. Cell value autocomplete (type-ahead of existing column values)

**What it does.** While editing a cell, a dropdown suggests **values that already exist in
that column across the workspace**, matched to what you're typing. Clicking one fills the
cell. (This mirrors the old r3-team `CustomAutocomplete`.)

**Covered field types:** **Text** (incl. Company Name), **Email**, **Phone**, and **People
Name** (first/last). Not yet covered: Links, Address, Number.

**How it works.** A debounced `useFindManyRecords` query with an `ilike` filter on the field
(or its composite sub-field), de-duplicated to the top distinct matches. Because the query is
server-side it finds values on rows not currently loaded.

**Where it lives.**
- [useColumnValueSuggestions.ts](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useColumnValueSuggestions.ts) — generic debounced distinct-value query (caller supplies filter / fields / value extractor).
- [FieldValueSuggestions.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/FieldValueSuggestions.tsx) — plain fields + single-sub-field composites (`primaryEmail`, `firstName`, `lastName`).
- [PhoneValueSuggestions.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/PhoneValueSuggestions.tsx) — phone-specific (see gotcha below).
- [FieldValueSuggestionsDropdown.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/FieldValueSuggestionsDropdown.tsx) — the presentational dropdown.
- [useFieldInputObjectNameSingular.ts](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/hooks/useFieldInputObjectNameSingular.ts) — resolves the object name from field context.
- Wired into: [TextFieldInput.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/TextFieldInput.tsx), [EmailsFieldInput.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/EmailsFieldInput.tsx) & [PhonesFieldInput.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/PhonesFieldInput.tsx) (via a `renderSuggestions` prop on [MultiItemFieldInput.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/MultiItemFieldInput.tsx)), and [FullNameFieldInput.tsx](packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/input/components/FullNameFieldInput.tsx) (via render-props on [DoubleTextInput.tsx](packages/twenty-front/src/modules/ui/field/input/components/DoubleTextInput.tsx)).

**Gotchas worth knowing before extending this:**
1. **Mount the query lazily.** `useFindManyRecords` resolves object metadata eagerly and
   **throws** on an unresolved object name — so the suggestions component is only *mounted*
   once both the object name and a non-empty search value are present (never mount it in a
   context without metadata, e.g. bare Storybook).
2. **Dropdown must render in normal flow**, not `position: absolute`. The cell edit card
   (`OverlayContainer`) has `overflow: hidden`; an absolutely-positioned dropdown gets
   clipped ("hidden inside the input"). In-flow lets the card grow — same as Select cells.
3. **Phone storage vs input.** Numbers are stored split (national number + separate calling
   code, e.g. `123456789` + `+1`) but the input works in **E.164**. `PhoneValueSuggestions`
   matches on the **national** number and suggests the **full E.164** value so the phone
   input can re-parse it on select. Best-effort; short/fake numbers can trip parsing.

### Bug fix: app boot

Fixed a name mismatch where [WidgetContentRenderer.tsx](packages/twenty-front/src/modules/page-layout/widgets/components/WidgetContentRenderer.tsx)
imported `WorkflowEmailTemplatesWidget` while the module exports
`WorkflowEmailTemplatesWidgetEffect` — the mismatch was blanking the whole app.

---

## Email & Calendar integration (Gmail / Google Calendar)

This is **core Twenty functionality** (documented here so a collaborator understands what the
CRM does out of the box), followed by the **fork-specific / WIP** layer we're building on top.

It is **not Gmail-only.** Three providers sit behind a common driver abstraction, dispatched
by `ConnectedAccountProvider` ([enum](packages/twenty-shared/src/types/ConnectedAccountProvider.ts)):
**Google/Gmail**, **Microsoft/Outlook**, and **IMAP/SMTP/CalDAV**. Each provider is gated by a
server config flag (`MESSAGING_PROVIDER_GMAIL_ENABLED`, `CALENDAR_PROVIDER_GOOGLE_ENABLED`,
Microsoft equivalents) mirrored by front-end `client-config` atoms.

### Connecting an account (shared by email + calendar)

**One OAuth grant powers both email and calendar.** Connecting a Google (or Microsoft)
account creates a `ConnectedAccount` plus a `MessageChannel` **and** a `CalendarChannel`, then
kicks off the first sync. IMAP/SMTP/CalDAV connects via a credentials form instead of OAuth.

- **Settings → Accounts** is the entry point. Front-end: `packages/twenty-front/src/modules/settings/accounts/` (`hooks/useTriggerApiOAuth.ts` redirects to the OAuth flow; `components/SettingsAccountsConnectionForm.tsx` for IMAP/SMTP/CalDAV; `useTriggerProviderReconnect.ts` for re-auth).
- Server OAuth + account/channel creation: `packages/twenty-server/src/engine/core-modules/auth/` (`services/google-apis.service.ts`, scope helpers) and `packages/twenty-server/src/modules/connected-account/` (OAuth2 client, token refresh, email aliases). Google requests Gmail **and** `calendar.events` scopes together.

### Email (messaging)

- **Sync/import.** Emails pull into `MessageChannel → MessageThread → Message → MessageParticipant` (joined via `MessageChannelMessageAssociation`). **Full** sync lists all non-excluded mail; **incremental** sync uses Gmail's `history` API cursor. Two-phase pipeline: list-fetch (cron `2-59/5 * * * *`, ~every 5 min) → import bodies (cron `*/1 * * * *`, every min). Spam/trash/promotions labels are excluded.
- **On a record.** An **Emails** tab shows threads for that record's participants; opening one shows the full message list. Front-end: `packages/twenty-front/src/modules/activities/emails/` (`EmailsCard.tsx`, `EmailThread*` components).
- **Sending (core).** A `sendEmail` GraphQL mutation (gated by the `SEND_EMAIL_TOOL` permission) composes MIME and sends via the account's provider driver, then persists the sent message so it appears immediately.
- **Settings/controls.** Per-channel: **visibility** (`METADATA` / `SUBJECT` / `SHARE_EVERYTHING`), **contact auto-creation** (+ policy, exclude group / non-professional emails), **blocklist** (blocked addresses re-import or purge messages), **folder** selection, sync-status indicators, and manual re-sync.
- **Server module:** `packages/twenty-server/src/modules/messaging/` — `message-import-manager/` (sync, provider drivers `gmail`/`microsoft`/`imap`/`inbound-email`, crons), `message-outbound-manager/` (send), `blocklist-manager/`, `message-folder-manager/`, `common/standard-objects/` (the message/thread/participant/channel entities).

### Calendar (Google Calendar)

- **Sync/import.** Events pull into `CalendarEvent`, linked to channels via
  `CalendarChannelEventAssociation`, with `CalendarEventParticipant` matched to People /
  Workspace Members. Google reads the account's **`primary`** calendar only; sync is
  **incremental** via Google's sync token (full-syncs on token expiry). List-fetch cron runs
  ~every 5 min, then an import stage persists events.
- **On a record.** A **Calendar** section/widget shows that record's past & upcoming events
  grouped by month/day (read-only). Front-end: `packages/twenty-front/src/modules/activities/calendar/` (`CalendarEventsCard.tsx`) surfaced via `page-layout/widgets/calendar/`.
- **Settings/controls.** Per-channel **visibility** — **Everything** (`SHARE_EVERYTHING`, full
  event details shared) vs **Metadata** (`METADATA`, only date & participants; title/description
  are hidden from other members server-side) — plus contact auto-creation and sync status.
- **Server module:** `packages/twenty-server/src/modules/calendar/` — `calendar-event-import-manager/` (sync, provider drivers `google-calendar`/`microsoft-calendar`/`caldav`, crons), `calendar-event-participant-manager/`, `common/standard-objects/` (calendar channel / event / participant / association entities). Timeline API: `packages/twenty-server/src/engine/core-modules/calendar/`.

> **Don't confuse these:** `object-record/record-calendar/` is a calendar *view layout* for
> any object with a date field — it is **not** the Google Calendar integration.

### Fork-specific / WIP layer (on this branch)

Built on top of core, **not yet stable** — a collaborator should treat these as in-progress:

- **Reply / reply-all / forward "email message actions"** — server `message-outbound-manager/resolvers/email-message-action.resolver.ts` + `services/email-message-action.service.ts`; front-end [useEmailMessageAction.ts](packages/twenty-front/src/modules/activities/emails/hooks/useEmailMessageAction.ts) + `emailMessageAction` mutation + `formatEmailMessageText.ts`. (Core `EmailThreadBottomBar` reply buttons are still placeholders being wired to these.)
- **Compose email UI** — extended `EmailComposerFields.tsx` / `useEmailComposerState.ts`, side-panel compose (`side-panel/pages/compose-email/`), and a command-menu `ComposeEmailCommand`.
- **Marketing / campaign emailing (bulk)** — server `packages/twenty-server/src/modules/emailing/` (campaign service, message lists, send-campaign job, unsubscribe); front-end `activities/emails/components/CampaignComposerFields.tsx` + `useSendMessageCampaign`. This is the bulk layer (upstream WIP #21173 + our enhancements), distinct from 1:1 send.
- **Communications page** — `packages/twenty-front/src/pages/communications/`.

---

## Other in-progress areas on this branch

Non-email WIP already present on `feature/sandbox`, flagged so a collaborator knows it exists
(Kyle to confirm status):

- **Lead-status field** — workspace migration command under `packages/twenty-server/src/database/commands/upgrade-version-command/2-15/`.

---

## Verifying changes

```bash
# Frontend
npx nx lint:diff-with-main twenty-front      # lint only the diff (fast)
npx nx typecheck twenty-front
cd packages/twenty-front && npx jest <pattern>   # single-file/pattern tests

# Backend
npx nx typecheck twenty-server
```

For UI changes, drive the running app (login required) and exercise the affected flow.

---

## Goals / Planned work

Product targets for the R3 CRM. Implementation is TBD; the "Connects to" notes point at
existing systems (documented above) that are the natural starting points.

### 1. Client reminders

Set a **reminder on a client** (Person / Company / Lead) — e.g. "follow up on this date."

- *Connects to:* Twenty's **Tasks** object (due date + assignee) and its notification system;
  surfaced on the record page and ideally in the daily-tasks calendar view (goal #2).

### 2. Daily tasks on the calendar

**View the day's tasks on a calendar** so a rep can see what's due each day.

- *Connects to:* Tasks + the calendar surfaces — either the record **calendar view layout**
  (`object-record/record-calendar/`, driven by a task due-date field) or a dedicated
  day/agenda view. Distinct from the Google Calendar *integration*, though the two could be
  shown together later.

### 3. Email templates with attachments, sent from a Lead

**Create reusable email templates** that can **include file attachments**, and **send them
from a Lead record** through the CRM's email integration.

- *Connects to:* the email **send** layer (`sendEmail`, the compose UI, `EmailComposerFields`
  attachment handling), the existing **email-templates** concept
  (`WorkflowEmailTemplatesWidget`), and the fork's compose/campaign work. Key sub-parts: a
  template store (subject/body/attachments), a "send from lead" action that pre-fills the
  composer from the lead's data, and attachment upload/storage.

### 4. Reporting at the point of action (automatic first)

Make **reporting happen at the point of action, as automatically as possible** — the act of
doing the thing (sending an email, completing a task, etc.) should generate the report/log
without a separate manual step.

Where it can't be automatic:
- **Keep the logging within the Lead** — activity is recorded on the lead record itself.
- **Mass-report from the Leads table** — select multiple rows in the Leads table and report on
  all of them at once.

- *Connects to:* activity logging on records; and the **RecordTable** work we already built —
  mass-report can reuse the existing **row selection + inline bulk action** pattern (see
  *Inline bulk field-edit*), applying a "report/log" action across the selected leads.

### 5. Demo box request flow

A **"request a demo box"** action on a client/lead that:

- **Auto-routes the request to Trenton** with the **client's info and shipping address**
  (no manual hand-off — the request is created and assigned/sent to Trenton automatically).
- **Notifies the client** when the demo box is **sent**.

- *Connects to:* an automation/workflow (routing + notifications), the lead/client record data
  (address fields), and the email/notification layer for the client-facing "your demo is on
  the way" message. Consider modeling the request itself as a record (status: requested →
  sent) so it's trackable and reportable (ties into goal #4).
