/**
 * Plain-language help for each admin screen. Shown in the dialog that opens from the page
 * title. `tip` is the one-line summary shown when hovering the title.
 *
 * Keyed by the id of the page's <h1>. Keep the wording non-technical: say what a thing does
 * and why someone would use it.
 */

export interface HelpItem {
  name: string;
  /** What it does. */
  what: string;
  /** Why it is useful. */
  why: string;
}

export interface PageHelp {
  title: string;
  /** One line, shown on hover. */
  tip: string;
  /** What the page is for, in two or three sentences. */
  purpose: string;
  items: HelpItem[];
  /** Who can do what, and other things worth knowing. */
  goodToKnow: string[];
}

export const PAGE_HELP: Record<string, PageHelp> = {
  'admin-analytics-title': {
    title: 'Data Analytics',
    tip: 'Charts that compare, rank, and track survey answers over time and across groups.',
    purpose:
      'Data Analytics goes deeper than the Dashboard. It shows how answers change over time, how strongly residents want each feature, and where problems cluster, so you can spot patterns to follow up on.',
    items: [
      {
        name: 'Filters',
        what: 'Narrow every chart by date range, phase, or resident type.',
        why: 'Lets you compare groups, for example whether tenants want different features than homeowners.',
      },
      {
        name: 'Rating bars',
        what: 'Each bar splits the answers from low to high, with the average beside it.',
        why: 'Shows whether an average hides a split opinion.',
      },
      {
        name: 'Download PDF',
        what: 'Opens the capstone documentation as a print-ready report: title page, executive summary, background, data description, methodology, numbered tables and figures with interpretation, findings, conclusions, recommendations, limitations, and references, with screenshots of the resident and superadmin sides in the methodology. Choose "Save as PDF" in the print dialog.',
        why: 'Gives the study team and advisers a document to read, share, or attach to a findings note.',
      },
      {
        name: 'Download Word (.docx)',
        what: 'Saves the same documentation as an editable Word file, with the charts included as pictures.',
        why: 'Lets the study team edit the text, fill in the placeholders, and format the document for submission.',
      },
      {
        name: 'Problems by phase',
        what: 'A grid of the most reported problems against each phase.',
        why: 'Helps find problems that are concentrated in one area.',
      },
    ],
    goodToKnow: [
      'Numbers come from live responses and follow the same permission as the Dashboard.',
      'Residents who chose "Not applicable" are left out of the averages.',
      'With few responses, small differences between groups are not reliable.',
    ],
  },
  'admin-overview-title': {
    title: 'Dashboard',
    tip: 'A live summary of survey responses. Use the date range to focus on a period, and the cards to jump into detail.',
    purpose:
      'The Dashboard is your at-a-glance picture of how the survey is going. It turns submitted answers into totals and charts, so you can see progress and patterns without opening every response.',
    items: [
      {
        name: 'Date range',
        what: 'Limits every number and chart to a period: the last 7 days, the last 30 days, all time, or dates you choose.',
        why: 'Lets you check what changed this week, or compare a recent stretch with the whole survey.',
      },
      {
        name: 'Detailed and Simple views',
        what: 'Detailed shows every card and chart. Simple shows only the key numbers.',
        why: 'Pick the amount of information you need right now, for example Simple for a quick check-in with your adviser.',
      },
      {
        name: 'Summary cards and charts',
        what: 'Show totals, such as how many residents responded, and how people answered key questions. Selecting one takes you to the matching chart in Responses.',
        why: 'Helps you spot something interesting and then dig into the details in one click.',
      },
      {
        name: 'Survey status',
        what: 'A small label that says whether the survey is open or paused for new answers.',
        why: 'So you always know if residents can still submit while you are reading the results.',
      },
      {
        name: 'Recent submissions and activity',
        what: 'Lists the newest responses and recent team activity.',
        why: 'Gives you a quick sense of what has just come in.',
      },
    ],
    goodToKnow: [
      'Numbers update from the live data. They only count responses inside the date range you picked.',
      'Open Responses when you want to read the actual answers.',
    ],
  },

  'admin-responses-title': {
    title: 'Responses',
    tip: 'Explore every submitted answer as a summary, one question at a time, or one resident at a time.',
    purpose:
      'Responses is where you read and analyse what residents told you. You can look at the big picture across everyone, focus on a single question, or open one resident to see everything they answered.',
    items: [
      {
        name: 'Summary tab',
        what: 'Shows charts for the main questions across all matching responses. You can add or remove charts with Add widget, and copy a chart to paste into your paper or slides.',
        why: 'Gives the overall picture and lets you build the set of charts that matter to your study.',
      },
      {
        name: 'Question tab',
        what: 'Shows the results for one question at a time. Pick a question from the list or step with the arrows. A link lets you write a finding note about that question.',
        why: 'Helps you study a question closely and record what you notice while it is in front of you.',
      },
      {
        name: 'Individual tab',
        what: 'Shows one resident at a time: who they are, which extra sections they saw, and every question they answered. Pick a response from the list or step with the arrows.',
        why: 'Lets you read a full story, check an odd answer, or confirm a response looks right.',
      },
      {
        name: 'Search & filters',
        what: 'Opens search, phase, branch (tenant or homeowner) and sort. A badge shows how many filters are on, and Clear removes them.',
        why: 'Narrows everything on the page to the group you care about, for example only Phase 3 tenants.',
      },
      {
        name: 'Date range',
        what: 'Limits responses to a period, the same way as on the Dashboard.',
        why: 'Useful for looking at one stretch of data collection.',
      },
      {
        name: 'Menu (⋮)',
        what: 'Copy summary text to the clipboard, or download the matching responses as a CSV spreadsheet.',
        why: 'Gets your data out for your write-up or for analysis in a spreadsheet.',
      },
      {
        name: 'Deleting a response',
        what: 'Available from the menu on the Individual tab. It always asks you to confirm first.',
        why: 'For removing a mistaken or test response. It cannot be undone once the live data is changed.',
      },
    ],
    goodToKnow: [
      'Everything you see follows the search, filters and date range at the top.',
      'Questions in a section a resident never saw are saved as “not shown”, so a skipped question and an unasked one stay different in analysis.',
      'Advisers can read everything here but cannot delete responses.',
    ],
  },

  'admin-interview-title': {
    title: 'Interview Invites',
    tip: 'Residents who agreed to a follow-up interview. Move each card through outreach, keep notes, and check when people are free.',
    purpose:
      'At the end of the survey, some residents agree to a follow-up interview. This page is your to-do board for reaching out to them, so nobody is forgotten and you always know who is confirmed.',
    items: [
      {
        name: 'The three columns',
        what: 'Not Yet Contacted, Pending Confirmation, and Confirmed. Each resident is a card that moves along as you make progress.',
        why: 'You can see at a glance who still needs a message, who has not replied, and who is booked.',
      },
      {
        name: 'Mark Contacted',
        what: 'Moves a card forward after you have reached out to that resident.',
        why: 'Keeps the board honest so teammates do not contact the same person twice.',
      },
      {
        name: 'Notes',
        what: 'Opens a notes panel on a card where you can record what was said and agreed.',
        why: 'Keeps the whole team informed about each conversation in one place.',
      },
      {
        name: 'Availability calendar',
        what: 'Shows the times residents said they are free.',
        why: 'Helps you pick interview slots that suit the residents.',
      },
      {
        name: 'Summary numbers and Sort',
        what: 'Totals at the top show how many are in each stage. Sort changes the order of the cards.',
        why: 'Lets you check progress quickly and work through the list in the order you prefer.',
      },
    ],
    goodToKnow: [
      'Only Proponents and Superadmins can delete an invite. Advisers can view them.',
      'Residents are contacted by you, using the email or details they gave. This page does not send messages for you.',
    ],
  },

  'finding-notes-title': {
    title: 'Findings Log',
    tip: 'Analysis notes linked to Responses questions. Advisers can read; only authors (and superadmins) can edit.',
    purpose:
      'The Findings Log is the team’s shared notebook for what the data shows. Each note is tied to a survey question, so your observations stay connected to the evidence behind them.',
    items: [
      {
        name: 'Writing a note',
        what: 'Create a note, choose the question it is about, and write what you noticed.',
        why: 'Captures insights while they are fresh, so they are easy to find when you write your paper.',
      },
      {
        name: 'Finding and filtering notes',
        what: 'Search the list, or show only your own notes.',
        why: 'Helps you find the right note quickly as the log grows.',
      },
      {
        name: 'Opening a note',
        what: 'Shows the full note with its linked question and details, and lets the author edit it.',
        why: 'Lets the team read the reasoning behind each finding.',
      },
      {
        name: 'Feedback on a note',
        what: 'Advisers can leave feedback that is handled in Reviews.',
        why: 'Keeps advice and replies organised instead of scattered across chats.',
      },
    ],
    goodToKnow: [
      'Proponents and Superadmins can create and edit their own notes.',
      'Advisers can read notes but cannot change them.',
      'If you cannot open this page, a Superadmin needs to turn on the Findings Log for your account.',
    ],
  },

  'reviews-title': {
    title: 'Reviews',
    tip: 'Advisers comment on a finding note, a survey question, or the instrument. Proponents reply and mark a thread addressed.',
    purpose:
      'Reviews is where advisers give structured feedback on your work and where you respond to it. Every comment is a thread with a clear status, so it is obvious what still needs attention.',
    items: [
      {
        name: 'Threads',
        what: 'A thread is a comment attached to a finding note, a survey question, or the instrument, with replies underneath.',
        why: 'Keeps feedback next to the thing it is about, with the full conversation in one place.',
      },
      {
        name: 'Starting a review (advisers)',
        what: 'Advisers start a thread and set how serious the issue is.',
        why: 'Helps the team tackle the most important feedback first.',
      },
      {
        name: 'Replying and marking addressed (proponents)',
        what: 'Proponents reply to a thread and mark it addressed once they have made the change.',
        why: 'Tells the adviser the work is done and ready to be checked.',
      },
      {
        name: 'Resolve and reopen (advisers)',
        what: 'Only an adviser can close a thread as resolved, or reopen it if more work is needed.',
        why: 'Keeps the final decision with the adviser.',
      },
      {
        name: 'Inbox filters',
        what: 'Narrow the list by status, such as open, addressed, or resolved.',
        why: 'Lets you focus on what is waiting for you.',
      },
    ],
    goodToKnow: [
      'Everyone on the team can open Reviews, but what you can do depends on your role.',
      'Superadmins can see everything and can manage threads when needed.',
    ],
  },

  'inquiries-title': {
    title: 'Inquiries',
    tip: 'Messages from the homepage contact form. Reply from your own email, then set a status so the team knows where each one stands.',
    purpose:
      'When someone writes to you through the contact form on the public homepage, their message lands here. This page helps the team make sure every message gets an answer.',
    items: [
      {
        name: 'Reading a message',
        what: 'Each inquiry shows who wrote, their message, and when it arrived. Open one to see the full text.',
        why: 'So you can understand the question before replying.',
      },
      {
        name: 'Replying',
        what: 'Use the email button to answer from your own email app. The website does not send the reply for you.',
        why: 'Replies come from a real person on the team, which residents trust more.',
      },
      {
        name: 'Status',
        what: 'Mark each inquiry as New, In progress, or Resolved.',
        why: 'The whole team can see which messages are waiting, being handled, or finished, so nothing is answered twice or missed.',
      },
      {
        name: 'Search, filter and layout',
        what: 'Search by name or message, filter by status, and switch between card, compact and list layouts.',
        why: 'Helps you handle a long inbox in the way that suits you.',
      },
    ],
    goodToKnow: [
      'Only Proponents and Superadmins can see this page. Advisers cannot.',
      'Messages come from the public website, so treat personal details with care.',
    ],
  },

  'admin-members-title': {
    title: 'Members & Invites',
    tip: 'Who can use this workspace. Invite teammates, approve access requests, and change roles and page permissions.',
    purpose:
      'This page controls who can use the workspace and what they can do. It is how you bring new teammates in, approve people who ask for access, and keep permissions tidy.',
    items: [
      {
        name: 'Invites',
        what: 'Create an invite with a person’s email and role. Copy the sign-up link and send it to them yourself, because the app does not email it.',
        why: 'Only people you invite can join, which keeps survey data private.',
      },
      {
        name: 'Access requests',
        what: 'People who sign up without an invite wait as pending until a Superadmin approves them and picks a role.',
        why: 'Gives you control over who gets in.',
      },
      {
        name: 'Roles',
        what: 'Superadmin can do everything. Proponent is the everyday research role. Adviser can read research data and give review feedback.',
        why: 'Each person gets the access that matches their job, and no more.',
      },
      {
        name: 'Page permissions',
        what: 'Switches decide which pages a person can use, such as Findings Log or Interview Invites.',
        why: 'Lets you share only what each person needs.',
      },
      {
        name: 'Access code and removals',
        what: 'Superadmins can manage the sign-up access code and remove members. Removing asks you to confirm.',
        why: 'Lets you keep the team list current when people leave.',
      },
    ],
    goodToKnow: [
      'Only Proponents and Superadmins can open this page. Approving, changing roles and removing people is for Superadmins.',
      'The board groups people by stage: invited, pending, active, and removed.',
    ],
  },

  'survey-control-title': {
    title: 'Survey control',
    tip: 'Decide when residents can take the survey, and what they see when they can’t. Changes apply as soon as you save.',
    purpose:
      'Survey control is the on and off switch for the resident survey. You decide whether people can answer right now, for how long, and what message they see otherwise.',
    items: [
      {
        name: 'Survey window',
        what: 'Choose Open, Paused, or Closed.',
        why: 'Open lets residents answer. Pause is a temporary stop, for example to fix a question. Close ends data collection.',
      },
      {
        name: 'Schedule (optional)',
        what: 'Pick a date and time for the survey to open and close by itself.',
        why: 'Lets you plan collection ahead without having to be online at the right moment.',
      },
      {
        name: 'Survey version',
        what: 'Chooses which published set of questions residents see.',
        why: 'Lets you switch to an updated question set while keeping earlier responses tied to the version they answered.',
      },
      {
        name: 'Message to residents',
        what: 'Write what people see when the survey is not open. Ready-made templates are available.',
        why: 'A clear, friendly message avoids confusion and tells residents what to do next.',
      },
      {
        name: 'Progress cards and history',
        what: 'Show time left in the window, total responses toward the target, and a list of recent changes.',
        why: 'Helps you track collection and see who changed what.',
      },
      {
        name: 'Reset',
        what: 'Returns the survey to open with the default version, after you confirm.',
        why: 'A quick way back to a known, working setup.',
      },
    ],
    goodToKnow: [
      'Only Superadmins can change these settings.',
      'Changes apply as soon as you save, and residents notice them straight away.',
      'Use the preview link to see exactly what residents see.',
    ],
  },

  'survey-builder-heading': {
    title: 'Survey builder',
    tip: 'Edit the survey questions and who sees which question, without touching code.',
    purpose:
      'The Survey builder is where you shape the survey: its questions, their order, and the rules that decide who sees what. You work on a safe copy called a draft, then publish it when you are happy.',
    items: [
      {
        name: 'Versions',
        what: 'Pick which version you are looking at. Published versions are frozen. Choose Edit as draft to make a copy you can change.',
        why: 'Answers stay tied to the exact questions residents saw, so your data is never muddled by later edits.',
      },
      {
        name: 'Questions and steps',
        what: 'Questions are grouped into steps, like pages of the survey. You can add, edit, reorder and delete them, and switch between Comfortable, Compact, List and Table layouts.',
        why: 'Gives you full control of what residents are asked and in what order.',
      },
      {
        name: 'Branching rules',
        what: 'In the side panel, set when a question is shown, for example only if an earlier answer was “Tenant”. Rules can combine with “all of these” or “any of these”.',
        why: 'Residents only see questions that apply to them, which keeps the survey short and relevant.',
      },
      {
        name: 'Problems and warnings',
        what: 'A checker lists mistakes, such as a rule pointing at a missing question. Selecting one jumps to it.',
        why: 'Catches errors before residents ever see them.',
      },
      {
        name: 'Preview',
        what: 'Opens the survey as a resident would see it.',
        why: 'Lets you test the questions and branching safely.',
      },
      {
        name: 'Save and Publish',
        what: 'Save keeps your draft. Publish makes it the live survey and archives the old one.',
        why: 'You can work slowly on a draft, and residents only see changes when you decide.',
      },
    ],
    goodToKnow: [
      'Only Proponents and Superadmins can use the builder. Publishing is blocked while problems remain.',
      'Some core questions have locked codes, because the Dashboard reads them.',
      'Deleting a question or a draft asks you to confirm first.',
    ],
  },
};
