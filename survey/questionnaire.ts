/**
 * Needs-assessment items, v2.
 * Core = 6. Extended = 4 more. Extended renders only when fewer than
 * three gated sections (3b, 4, 5, 7a, 7b) apply.
 */

export type ItemPool = 'core' | 'extended';

export type SurveyItem = {
  id: string;
  sectionId: string;
  pool: ItemPool;
  q: string;
  sub?: string;
} & (
  | { type: 'likert'; ends: readonly [string, string] }
  | { type: 'choice'; options: readonly string[] }
  | { type: 'check'; options: readonly string[] }
  | { type: 'number'; placeholder?: string }
  | { type: 'text' }
);

export type SectionGateFlags = {
  perimeter: boolean;
  s4: boolean;
  s5: boolean;
  s7a: boolean;
  s7b: boolean;
};

const L = (
  sectionId: string,
  pool: ItemPool,
  id: string,
  q: string,
  ends: readonly [string, string],
  sub?: string,
): SurveyItem => ({ id, sectionId, pool, type: 'likert', q, ends, sub });

const C = (
  sectionId: string,
  pool: ItemPool,
  id: string,
  q: string,
  options: readonly string[],
  sub?: string,
): SurveyItem => ({ id, sectionId, pool, type: 'choice', q, options, sub });

const S2: SurveyItem[] = [
  L(
    's2',
    'core',
    's2_adequacy',
    'How adequate are the current ways you can reach the HOA office when you have a concern or request?',
    ['Very inadequate', 'Very adequate'],
    'Think about dropping by the office, calling, or sending a message on Facebook.',
  ),
  L(
    's2',
    'core',
    's2_frequency',
    'How often has submitting a request or form to the HOA taken longer than you expected?',
    ['Always', 'Never'],
    'The HOA office is open Monday to Saturday, 8:00 AM to 5:00 PM only.',
  ),
  L(
    's2',
    'core',
    's2_satisfaction',
    'How satisfied are you with how the HOA currently handles your requests?',
    ['Very dissatisfied', 'Very satisfied'],
    'This includes anything submitted in person, by phone, or through Facebook.',
  ),
  L(
    's2',
    'core',
    's2_effectiveness',
    "How effective is the HOA's Facebook page in keeping you updated about important announcements?",
    ['Not effective at all', 'Extremely effective'],
    'This is the personal Facebook profile currently used, not a page, app, or website.',
  ),
  L(
    's2',
    'core',
    's2_agreement',
    'I would prefer to submit HOA forms and requests through my phone or computer instead of printing and dropping them off in person.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  C(
    's2',
    'core',
    's2_printer_access',
    'How do you currently produce a physical copy of a downloaded HOA form?',
    [
      'I own a printer at home',
      'I pay to print at a computer shop or print stall',
      'I print at my workplace',
      'I ask a neighbor or relative',
    ],
  ),
  {
    id: 's2_delay_days',
    sectionId: 's2',
    pool: 'extended',
    type: 'number',
    q: 'On average, how many days pass between downloading a form and successfully submitting it?',
    placeholder: 'Number of days',
  },
  C(
    's2',
    'extended',
    's2_abandonment',
    'Has the requirement to submit forms in person ever caused you to delay or fully give up on a request or updating your 201 file?',
    ['Yes', 'No'],
  ),
  L(
    's2',
    'extended',
    's2_multiple_trips',
    'How often do you need to make more than one trip to the office to complete a single transaction?',
    ['Never', 'Very often'],
  ),
  L(
    's2',
    'extended',
    's2_requirement_clarity',
    'How clear are you on what documents or steps are needed before you go to the office?',
    ['Not at all clear', 'Very clear'],
  ),
];

const S3A: SurveyItem[] = [
  L(
    's3a',
    'core',
    's3a_confidence',
    'How confident are you that security guards could reach your home quickly if there were a break-in or intrusion attempt?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's3a',
    'core',
    's3a_reliability',
    'If you needed to alert a guard quickly about a security concern, how reliable do you think your current options are?',
    ['Very unreliable', 'Very reliable'],
    'For example, calling the guardhouse or walking to the gate.',
  ),
  L(
    's3a',
    'core',
    's3a_awareness',
    'How aware are you of what security personnel currently do to patrol or monitor the subdivision?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's3a',
    'core',
    's3a_effectiveness',
    'How effective is your current way of contacting security during a genuine emergency?',
    ['Not effective at all', 'Extremely effective'],
  ),
  L(
    's3a',
    'core',
    's3a_sos_interest',
    'I would feel safer knowing I could send a silent alert with my exact location to security guards during an emergency.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  C(
    's3a',
    'core',
    's3a_current_channel',
    'Which of these best describes your current way of reaching security in an emergency?',
    [
      'Call the guardhouse phone',
      'Walk or drive to the gate',
      'Ask a neighbor to relay a message',
      "I don't have a reliable way right now",
    ],
  ),
  L(
    's3a',
    'extended',
    's3a_worry',
    'How often do you think about break-ins or trespassing as a possible concern where you live?',
    ['Never', 'Very often'],
  ),
  L(
    's3a',
    'extended',
    's3a_lighting',
    'How well-lit or visible are the pathways and common areas in your phase at night?',
    ['Not at all well-lit', 'Very well-lit'],
  ),
  L(
    's3a',
    'extended',
    's3a_patrol_visibility',
    'How often do you notice guards making rounds near your home?',
    ['Never', 'Very often'],
  ),
  L(
    's3a',
    'extended',
    's3a_location_clarity',
    'If you needed to describe your exact location to a guard over the phone, how easy would that be?',
    ['Very difficult', 'Very easy'],
  ),
];

const S3B: SurveyItem[] = [
  L(
    's3b',
    'core',
    's3b_exposure',
    'How exposed does your home feel, given its distance from the guardhouse or main gate?',
    ['Not at all exposed', 'Very exposed'],
  ),
  L(
    's3b',
    'core',
    's3b_intrusion_freq',
    'How often have you noticed anyone trying to access the subdivision through the perimeter wall or fence rather than the main gate?',
    ['Never', 'Very often'],
  ),
  L(
    's3b',
    'core',
    's3b_response_confidence',
    'How confident are you that a security response would reach the perimeter area near your home quickly?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's3b',
    'core',
    's3b_blindspot_awareness',
    'How aware are you of blind spots or poorly lit areas along the perimeter wall near your home?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's3b',
    'core',
    's3b_alert_value',
    'An alert system that sends my exact address straight to security would make a real difference for someone living where I do.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  C(
    's3b',
    'core',
    's3b_incident_flag',
    'Have you personally experienced or witnessed an attempted break-in or unauthorized entry near your home?',
    ['Yes', 'No', 'Prefer not to say'],
    'This only asks whether it happened, not for any details.',
  ),
  L(
    's3b',
    'extended',
    's3b_wall_check_freq',
    'How often do you personally check or notice the condition of the perimeter wall or fence near your home?',
    ['Never', 'Very often'],
  ),
  L(
    's3b',
    'extended',
    's3b_night_confidence',
    'How confident are you that a break-in attempt at night would be noticed before real damage or loss occurs?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's3b',
    'extended',
    's3b_lighting_adequacy',
    'How adequate is current lighting along the perimeter wall near your home?',
    ['Very inadequate', 'Very adequate'],
  ),
  L(
    's3b',
    'extended',
    's3b_report_usefulness',
    'How useful would it be to report a suspicious person near the perimeter wall without needing to leave your house?',
    ['Not at all useful', 'Very useful'],
  ),
];

const S4: SurveyItem[] = [
  L(
    's4',
    'core',
    's4_vawdesk_familiarity',
    "How familiar are you with the barangay VAW Desk and what it's meant to do?",
    ['Not at all familiar', 'Very familiar'],
    "The VAW Desk is the barangay's existing office for reporting concerns about violence against women and children.",
  ),
  L(
    's4',
    'core',
    's4_current_comfort',
    "How comfortable would you feel reporting a serious household safety concern through the HOA's current contact form or Facebook message?",
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's4',
    'core',
    's4_confidentiality_confidence',
    "How confident are you that a sensitive report made through the HOA's current channels would stay private?",
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's4',
    'core',
    's4_exposure_barrier',
    'How much do you think fear of a situation becoming known to others stops people from reporting concerns like this?',
    ['Not at all', 'A great deal'],
  ),
  L(
    's4',
    'core',
    's4_discreet_interest',
    'If a private, silent way to alert someone for help were available through this platform, how likely would you be to consider using it if you ever needed to?',
    ['Very unlikely', 'Very likely'],
  ),
  L(
    's4',
    'core',
    's4_trained_handler_confidence',
    'How confident are you that a report made through a dedicated, private channel would be handled by someone properly trained to respond?',
    ['Not at all confident', 'Very confident'],
  ),
  C(
    's4',
    'extended',
    's4_handler_preference',
    'Would you want a report like this to be reviewed only by a specifically assigned case handler, rather than general HOA staff?',
    ['Yes', 'No', 'No preference'],
  ),
  L(
    's4',
    'extended',
    's4_process_awareness',
    'How aware are you of what happens after a report is filed, such as who reviews it and how long it takes?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's4',
    'extended',
    's4_delay_barrier',
    'How much does the length of time a process might take affect whether someone would even start reporting a concern?',
    ['Not at all', 'A great deal'],
  ),
  L(
    's4',
    'extended',
    's4_written_comfort',
    'How comfortable would you feel using a written or app-based reporting option instead of speaking to someone in person?',
    ['Very uncomfortable', 'Very comfortable'],
  ),
];

const S5: SurveyItem[] = [
  L(
    's5',
    'core',
    's5_contact_awareness',
    "How aware are you of who to contact if you were concerned about a child's safety or wellbeing in this community?",
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's5',
    'core',
    's5_staff_comfort',
    "How comfortable would you feel raising a concern about a child's safety directly with HOA staff?",
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's5',
    'core',
    's5_privacy_confidence',
    "How confident are you that a concern about a child's safety would be kept private from other neighbors?",
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's5',
    'core',
    's5_conflict_barrier',
    "How much do you think fear of being wrong, or fear of conflict with a neighbor, stops people from raising concerns about a child's safety?",
    ['Not at all', 'A great deal'],
  ),
  L(
    's5',
    'core',
    's5_private_channel_interest',
    "A private way to raise a concern about a child's safety, separate from general complaints, would be useful to me.",
    ['Strongly disagree', 'Strongly agree'],
  ),
  L(
    's5',
    'core',
    's5_child_own_awareness',
    'How confident are you that the children in your household know who they could turn to if they ever felt unsafe?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's5',
    'extended',
    's5_response_confidence',
    "How confident are you that a report about a child's safety would be acted on quickly?",
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's5',
    'extended',
    's5_ra7610_awareness',
    'How aware are you of RA 7610 and what it protects children from?',
    ['Not at all aware', 'Very aware'],
    'RA 7610 is the Philippine law against child abuse, exploitation, and neglect.',
  ),
  L(
    's5',
    'extended',
    's5_child_disclosure_comfort',
    'How comfortable would your children be telling you if something made them feel unsafe in the community?',
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's5',
    'extended',
    's5_indirect_report_usefulness',
    "How useful would a private way to report a concern about a specific household's children be, without confronting them directly?",
    ['Not at all useful', 'Very useful'],
  ),
];

const S6: SurveyItem[] = [
  L(
    's6',
    'core',
    's6_fb_trust',
    "How much do you trust the HOA's current Facebook account to be the real, official source of HOA announcements?",
    ['Not at all', 'Completely'],
  ),
  L(
    's6',
    'core',
    's6_missed_updates',
    'How often have you missed an important HOA update because it was posted only on Facebook?',
    ['Never', 'Very often'],
  ),
  L(
    's6',
    'core',
    's6_separation_awareness',
    'How aware are you that a sensitive report and a routine maintenance request currently go through the exact same form or inbox?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's6',
    'core',
    's6_bystander_willingness',
    'How willing would you be to report a concern on behalf of a neighbor if you believed something serious was happening?',
    ['Very unwilling', 'Very willing'],
  ),
  L(
    's6',
    'core',
    's6_anonymity_importance',
    'How important is it to you that a report about a neighbor could be made without your name being attached?',
    ['Not at all important', 'Very important'],
  ),
  L(
    's6',
    'core',
    's6_verified_channel_trust',
    'I would trust an official, verified HOA channel more than the current personal Facebook account.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  C(
    's6',
    'extended',
    's6_current_discovery',
    'How do you currently find out about HOA announcements?',
    [
      'Facebook',
      'Word of mouth from neighbors',
      'Posted notices',
      "I often don't find out at all",
    ],
  ),
  L(
    's6',
    'extended',
    's6_authenticity_trouble',
    'How often have you had trouble confirming whether a message claiming to be from the HOA was actually genuine?',
    ['Never', 'Very often'],
  ),
  L(
    's6',
    'extended',
    's6_personal_account_awareness',
    'How aware are you that HOA officers use personal Facebook accounts rather than a single official page?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's6',
    'extended',
    's6_reviewer_separation_importance',
    'How important is it to you that routine maintenance requests and sensitive reports are reviewed by different people?',
    ['Not at all important', 'Very important'],
  ),
];

const S7A: SurveyItem[] = [
  L(
    's7a',
    'core',
    's7a_visit_difficulty',
    'How difficult is it for you to physically visit the HOA office to complete a transaction?',
    ['Not at all difficult', 'Extremely difficult'],
  ),
  L(
    's7a',
    'core',
    's7a_reliance_freq',
    'How often do you rely on someone else to complete an HOA transaction for you because of a disability or mobility limitation?',
    ['Never', 'Very often'],
  ),
  L(
    's7a',
    'core',
    's7a_current_channel_confidence',
    "How confident are you that the HOA's current website or Facebook page is easy for you to use given your specific needs?",
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's7a',
    'core',
    's7a_reporting_worth',
    "How worthwhile do you think it would be to report a barrier or accessibility problem you've encountered with HOA services?",
    ['Not at all worthwhile', 'Very worthwhile'],
  ),
  L(
    's7a',
    'core',
    's7a_online_interest',
    'An online option that lets me complete HOA transactions without visiting the office in person would make a real difference for me.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  L(
    's7a',
    'core',
    's7a_assistive_comfort',
    'How comfortable would you be using accessibility features like larger text or screen reader support, if available on an HOA website?',
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's7a',
    'extended',
    's7a_failed_transaction_freq',
    "How often have you been unable to complete an HOA transaction online because the website or form wasn't accessible to you?",
    ['Never', 'Very often'],
  ),
  L(
    's7a',
    'extended',
    's7a_fix_confidence',
    'How confident are you that reporting an accessibility problem to the HOA would actually lead to a fix?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's7a',
    'extended',
    's7a_formality_barrier',
    'How often do you feel that reporting an accessibility problem is too complicated or formal to be worth the effort?',
    ['Never', 'Very often'],
  ),
  L(
    's7a',
    'extended',
    's7a_rights_awareness',
    'How aware are you of your rights to accessible services under Philippine law?',
    ['Not at all aware', 'Very aware'],
    'This includes RA 7277, which requires accessible services from government and private institutions.',
  ),
];

const S7B: SurveyItem[] = [
  L(
    's7b',
    'core',
    's7b_handling_freq',
    'How often do you currently handle HOA transactions on behalf of a household member with a disability or mobility limitation?',
    ['Never', 'Very often'],
  ),
  L(
    's7b',
    'core',
    's7b_process_difficulty',
    "How difficult is it, in general, to complete these transactions on their behalf using the HOA's current process?",
    ['Not at all difficult', 'Extremely difficult'],
  ),
  L(
    's7b',
    'core',
    's7b_authorization_clarity',
    "How clear is it to you whether you're allowed to act on this household member's behalf for HOA matters?",
    ['Not at all clear', 'Very clear'],
  ),
  L(
    's7b',
    'core',
    's7b_formal_access_interest',
    'A formal caregiver access option, letting me handle transactions on their behalf officially, would be useful to our household.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  L(
    's7b',
    'core',
    's7b_staff_understanding',
    "How confident are you that HOA staff currently understand your role when you act on this household member's behalf?",
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's7b',
    'core',
    's7b_burden',
    'How much of a burden does helping with these transactions add to your own schedule?',
    ['Not a burden at all', 'A significant burden'],
  ),
  L(
    's7b',
    'extended',
    's7b_presence_requirement_freq',
    'How often does the household member you assist need to be physically present to complete a transaction, even with your help?',
    ['Never', 'Very often'],
  ),
  L(
    's7b',
    'extended',
    's7b_repeated_explanation_difficulty',
    "How difficult is it to explain your household member's specific needs to HOA staff each time, since there's no record of it?",
    ['Not at all difficult', 'Extremely difficult'],
  ),
  L(
    's7b',
    'extended',
    's7b_saved_profile_usefulness',
    "How useful would it be to save your household member's accessibility needs once, so you don't have to explain them every time?",
    ['Not at all useful', 'Very useful'],
  ),
  L(
    's7b',
    'extended',
    's7b_transaction_validity_confidence',
    "How confident are you that HOA staff treat a transaction you make on this household member's behalf as equally valid as one made directly by them?",
    ['Not at all confident', 'Very confident'],
  ),
];

const S7C: SurveyItem[] = [
  L(
    's7c',
    'core',
    's7c_barrier_awareness',
    'How aware are you of any accessibility barriers faced by neighbors with disabilities in this community?',
    ['Not at all aware', 'Very aware'],
  ),
  L(
    's7c',
    'core',
    's7c_importance',
    'How important do you think it is for the HOA to provide accessible digital services for PWD residents?',
    ['Not at all important', 'Very important'],
  ),
  L(
    's7c',
    'core',
    's7c_visibility',
    'How often do you see accessibility considered in HOA communications or community events?',
    ['Never', 'Very often'],
  ),
  L(
    's7c',
    'core',
    's7c_support_willingness',
    "How willing would you be to support changes that make HOA services more accessible, even if you don't personally need them?",
    ['Very unwilling', 'Very willing'],
  ),
  L(
    's7c',
    'core',
    's7c_shared_benefit',
    'Accessible services benefit the whole community, not just residents with disabilities.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  L(
    's7c',
    'core',
    's7c_physical_importance',
    'How important is physical accessibility, such as ramps and accessible pathways, in this community?',
    ['Not at all important', 'Very important'],
  ),
  L(
    's7c',
    'extended',
    's7c_witnessed_struggle_freq',
    'How often have you seen a neighbor struggle with an HOA process because of a disability or mobility limitation?',
    ['Never', 'Very often'],
  ),
  L(
    's7c',
    'extended',
    's7c_hoa_understanding',
    'How well do you think the HOA currently understands the needs of PWD residents?',
    ['Not at all well', 'Very well'],
  ),
  L(
    's7c',
    'extended',
    's7c_proxy_reporting_willingness',
    'How willing would you be to report an accessibility barrier on behalf of a neighbor who might not report it themselves?',
    ['Very unwilling', 'Very willing'],
  ),
  L(
    's7c',
    'extended',
    's7c_conversation_frequency',
    'How often do accessibility needs come up in conversations among residents in this community?',
    ['Never', 'Very often'],
  ),
];

const S8: SurveyItem[] = [
  L(
    's8',
    'core',
    's8_afterhours_clarity',
    'How clear are you on what to do if you have an urgent concern after the HOA office closes?',
    ['Not at all clear', 'Very clear'],
  ),
  L(
    's8',
    'core',
    's8_guard_confidence',
    'How confident are you that a guard could be reached quickly if you needed help outside office hours?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's8',
    'core',
    's8_frustration_freq',
    "How often has the office's limited hours left you without help exactly when you needed it?",
    ['Never', 'Very often'],
  ),
  L(
    's8',
    'core',
    's8_phone_reliability',
    'How reliable do you think it is to reach a guard by phone or radio right now?',
    ['Very unreliable', 'Very reliable'],
  ),
  L(
    's8',
    'core',
    's8_direct_alert_interest',
    'A direct digital emergency alert that reaches on-duty guards immediately, any time of day, would improve how safe I feel.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  C(
    's8',
    'core',
    's8_delayed_help_flag',
    'Has an HOA office closing time ever delayed help for something urgent for you?',
    ['Yes', 'No', 'Not sure'],
  ),
  L(
    's8',
    'extended',
    's8_guard_followthrough_confidence',
    'How confident are you that a guard, once alerted, knows what to do next in a genuine emergency?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's8',
    'extended',
    's8_nightsafety_impact',
    'How much does not knowing who to contact after hours affect your sense of safety at night?',
    ['Not at all', 'A great deal'],
  ),
  L(
    's8',
    'extended',
    's8_duty_visibility_usefulness',
    'How useful would it be to know exactly which guard or team is on duty at any given time?',
    ['Not at all useful', 'Very useful'],
  ),
  L(
    's8',
    'extended',
    's8_passive_detection_confidence',
    "How confident are you that an emergency near your home would be noticed quickly even if you couldn't call anyone?",
    ['Not at all confident', 'Very confident'],
  ),
];

const S9: SurveyItem[] = [
  L(
    's9',
    'core',
    's9_device_reliability',
    'How reliable is your access to a smartphone or computer for everyday tasks?',
    ['Not at all reliable', 'Very reliable'],
  ),
  L(
    's9',
    'core',
    's9_internet_reliability',
    'How reliable is your home internet connection?',
    ['Very unreliable', 'Very reliable'],
  ),
  L(
    's9',
    'core',
    's9_form_comfort',
    'How comfortable are you filling out forms or requests on a website or app in general?',
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's9',
    'core',
    's9_learning_confidence',
    'How confident are you that you could learn to use a new HOA website or app without much help?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's9',
    'core',
    's9_app_preference',
    'I would prefer receiving HOA updates through a mobile app or website instead of Facebook or printed notices.',
    ['Strongly disagree', 'Strongly agree'],
  ),
  {
    id: 's9_access_checklist',
    sectionId: 's9',
    pool: 'core',
    type: 'check',
    q: 'Which of these do you have reliable access to?',
    sub: 'Select all that apply.',
    options: [
      'Smartphone',
      'Computer or laptop',
      'Home internet',
      'Mobile data',
      'None of these regularly',
    ],
  },
  L(
    's9',
    'extended',
    's9_general_friction_freq',
    'How often do you experience problems, such as crashes, slow loading, or confusing steps, when using government or utility websites and apps in general?',
    ['Never', 'Very often'],
  ),
  L(
    's9',
    'extended',
    's9_sms_comfort',
    'How comfortable are you receiving important notifications through SMS text messages rather than an app or Facebook?',
    ['Very uncomfortable', 'Very comfortable'],
  ),
  L(
    's9',
    'extended',
    's9_help_confidence',
    'How confident are you that you could get help quickly if you ran into a problem using a new HOA app or website?',
    ['Not at all confident', 'Very confident'],
  ),
  L(
    's9',
    'extended',
    's9_low_end_importance',
    'How important is it to you that a new HOA app or website works well even on an older phone or a slow internet connection?',
    ['Not at all important', 'Very important'],
  ),
];

const S10: SurveyItem[] = [
  {
    id: 's10_open_feedback',
    sectionId: 's10',
    pool: 'core',
    type: 'text',
    q: "Is there anything else about HOA services, safety, or accessibility in Camella Homes Tibig you'd like us to know?",
    sub: 'Optional.',
  },
];

export const QUESTION_SECTIONS: Record<string, SurveyItem[]> = {
  s2: S2,
  s3a: S3A,
  s3b: S3B,
  s4: S4,
  s5: S5,
  s6: S6,
  s7a: S7A,
  s7b: S7B,
  s7c: S7C,
  s8: S8,
  s9: S9,
  s10: S10,
};

/** Section ids that can open or close from screening (plus s4 opt-in). */
const GATED_FLAGS = ['perimeter', 's4', 's5', 's7a', 's7b'] as const;

export function gatedSectionCount(gates: SectionGateFlags): number {
  return GATED_FLAGS.filter((flag) => gates[flag]).length;
}

/** Fewer than three gated sections → core + extended (10). Otherwise core only (6). */
export function showExtendedPool(gates: SectionGateFlags): boolean {
  return gatedSectionCount(gates) < 3;
}

export function sectionItems(sectionId: string, extended: boolean): SurveyItem[] {
  const rows = QUESTION_SECTIONS[sectionId] ?? [];
  return rows.filter((item) => item.pool === 'core' || extended);
}

export function allSectionItems(sectionId: string): SurveyItem[] {
  return QUESTION_SECTIONS[sectionId] ?? [];
}

/** Question count shown for this section. Screening stays 14. Final comments stay 1. */
export function sectionQuestionCount(sectionId: string, extended: boolean): number {
  if (sectionId === 'screening') return 14;
  return sectionItems(sectionId, extended).length;
}

export function sectionContentShown(sectionId: string, gates: SectionGateFlags): boolean {
  if (sectionId === 's3b') return gates.perimeter;
  if (sectionId === 's4') return gates.s4;
  if (sectionId === 's5') return gates.s5;
  if (sectionId === 's7a') return gates.s7a;
  if (sectionId === 's7b') return gates.s7b;
  return sectionId in QUESTION_SECTIONS || sectionId === 'screening';
}

export function formatItemAnswer(item: SurveyItem, value: string | number | string[] | undefined): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return 'Not answered';
  }
  if (item.type === 'likert') return `${String(value)} of 5`;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
