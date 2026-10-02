'use client';

import {
  getF3Wording,
  isHomeownerBranch,
  isOwnerLivingElsewhere,
  isTenantBranch,
  showAC1,
  showDeviceDependentItems,
  showOwnerLandlordOption,
  showP5,
} from '@/survey/branching';
import { INCLUDE_SEX_AND_CIVIL_STATUS, TENANT_ANSWERS_NOT_SHARED_WITH_LANDLORD_OR_HOA } from '@/survey/flags';
import type { SurveyAnswers } from '@/survey/schema';
import {
  LikertChoice,
  MultiChoice,
  NumberField,
  REQUIRED_NOTE,
  ResidentTypeField,
  SelectChoice,
  SingleChoice,
  TextField,
} from '@/components/survey/SurveyFields';

const OWNER_NOTE =
  'Answer for your unit, including what your representative or caretaker experiences.';

const A10_NOTE =
  'If you do not handle HOA transactions yourself, answer the later questions using what you know about your household\'s experience, or choose Not applicable.';

const ASSISTED_NOTE =
  'You can finish this survey with help. Someone you trust can read the questions and enter the answers you choose.';

type Patch = Partial<SurveyAnswers>;

export function StepView({
  step,
  answers,
  errors,
  onPatch,
}: {
  step: number;
  answers: Partial<SurveyAnswers>;
  errors: Record<string, string>;
  onPatch: (patch: Patch) => void;
}) {
  const a3Options = [
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
    { id: '6+', label: '6 or more' },
    ...(isOwnerLivingElsewhere(answers)
      ? [{ id: 'No one lives in the unit right now', label: 'No one lives in the unit right now' }]
      : []),
  ];

  const a10Options = [
    { id: 'i_do', label: 'I do' },
    { id: 'household_member', label: 'Another member of my household' },
    { id: 'caregiver_or_rep', label: 'A caregiver, helper, or representative' },
    ...(showOwnerLandlordOption(answers)
      ? [{ id: 'owner_or_landlord', label: 'The property owner or landlord' }]
      : []),
    { id: 'it_varies', label: 'It varies' },
  ];

  if (step === 1) {
    return (
      <>
        <p className="na-required-note">{REQUIRED_NOTE}</p>
        <p className="na-intro">
          Your answer to the first question decides which questions you will see. Nothing here asks
          for your name. You may choose &apos;Prefer not to say&apos; for personal questions.
        </p>
        <ResidentTypeField
          value={answers.A1}
          error={errors.A1}
          onChange={(A1) => onPatch({ A1: A1 as SurveyAnswers['A1'] })}
        />
        <SingleChoice
          code="A2"
          question="Which phase do you live in?"
          value={answers.A2}
          error={errors.A2}
          options={[
            { id: 'Phase 1', label: 'Phase 1' },
            { id: 'Phase 2', label: 'Phase 2' },
            { id: 'Phase 3', label: 'Phase 3' },
            { id: 'Phase 4 Heights', label: 'Phase 4 Heights' },
            { id: 'Phase 5 Highlands', label: 'Phase 5 Highlands' },
            { id: 'Phase 6 Eastgrove', label: 'Phase 6 Eastgrove' },
            { id: 'Not sure', label: 'Not sure' },
          ]}
          onChange={(A2) => onPatch({ A2: A2 as SurveyAnswers['A2'] })}
        />
        <SelectChoice
          code="A3"
          question="How many people live in the unit?"
          value={answers.A3}
          error={errors.A3}
          options={a3Options}
          onChange={(A3) => onPatch({ A3: A3 as SurveyAnswers['A3'] })}
        />
        <SingleChoice
          code="A4"
          question="Do you or another member of your household have a disability or mobility limitation?"
          value={answers.A4}
          error={errors.A4}
          options={[
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
            { id: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
          onChange={(A4) => onPatch({ A4: A4 as SurveyAnswers['A4'] })}
        />
        {showAC1(answers) ? (
          <>
            <MultiChoice
              code="AC1"
              question="What kind of difficulty applies to you or the household member? Select all that apply."
              value={answers.AC1}
              error={errors.AC1}
              exclusiveId="prefer_not_to_say"
              options={[
                { id: 'difficulty_walking_climbing', label: 'Difficulty walking or climbing stairs' },
                { id: 'uses_wheelchair_or_aid', label: 'Uses a wheelchair or mobility aid' },
                { id: 'difficulty_seeing', label: 'Difficulty seeing' },
                { id: 'difficulty_hearing', label: 'Difficulty hearing' },
                { id: 'difficulty_reading_forms', label: 'Difficulty reading or understanding forms' },
                { id: 'other', label: 'Other' },
                { id: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
              onChange={(AC1) => onPatch({ AC1 })}
            />
            {(answers.AC1 ?? []).includes('other') ? (
              <TextField
                code="AC1_other"
                question="Other"
                value={answers.AC1_other}
                maxLength={200}
                error={errors.AC1_other}
                onChange={(AC1_other) => onPatch({ AC1_other })}
              />
            ) : null}
          </>
        ) : null}
        <SingleChoice
          code="A5"
          question="In the past 12 months, did you have construction, renovation, or repair work done that needed outside workers to enter the subdivision?"
          value={answers.A5}
          error={errors.A5}
          options={[
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ]}
          onChange={(A5) => onPatch({ A5: A5 as SurveyAnswers['A5'] })}
        />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <SelectChoice
          code="A6"
          question="What is your age range?"
          value={answers.A6}
          error={errors.A6}
          options={[
            { id: '18-24', label: '18 to 24' },
            { id: '25-34', label: '25 to 34' },
            { id: '35-44', label: '35 to 44' },
            { id: '45-54', label: '45 to 54' },
            { id: '55-64', label: '55 to 64' },
            { id: '65+', label: '65 and above' },
            { id: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
          onChange={(A6) => onPatch({ A6: A6 as SurveyAnswers['A6'] })}
        />
        {INCLUDE_SEX_AND_CIVIL_STATUS ? (
          <>
            <SingleChoice
              code="A7"
              question="Sex"
              value={answers.A7}
              error={errors.A7}
              options={[
                { id: 'female', label: 'Female' },
                { id: 'male', label: 'Male' },
                { id: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
              onChange={(A7) => onPatch({ A7: A7 as SurveyAnswers['A7'] })}
            />
            <SelectChoice
              code="A8"
              question="Civil status"
              value={answers.A8}
              error={errors.A8}
              options={[
                { id: 'single', label: 'Single' },
                { id: 'married', label: 'Married' },
                { id: 'living_with_partner', label: 'Living with a partner' },
                { id: 'widowed', label: 'Widowed' },
                { id: 'separated', label: 'Separated' },
                { id: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
              onChange={(A8) => onPatch({ A8: A8 as SurveyAnswers['A8'] })}
            />
          </>
        ) : null}
        <SingleChoice
          code="A10"
          question="Who usually handles HOA transactions for your household?"
          value={answers.A10}
          error={errors.A10}
          options={a10Options}
          hint={answers.A10 && answers.A10 !== 'i_do' ? A10_NOTE : undefined}
          onChange={(A10) => onPatch({ A10: A10 as SurveyAnswers['A10'] })}
        />
        <SelectChoice
          code="A11"
          question="Which channel do you mainly use for HOA transactions?"
          value={answers.A11}
          error={errors.A11}
          options={[
            { id: 'walk_in', label: 'Walk in at the HOA office' },
            { id: 'phone', label: 'Phone call' },
            { id: 'facebook', label: 'Facebook page or message' },
            { id: 'email_or_website', label: 'Email or website' },
            { id: 'through_neighbor_or_officer', label: 'Through a neighbor or HOA officer' },
            { id: 'no_transaction_yet', label: 'I have not done any HOA transaction' },
          ]}
          onChange={(A11) => onPatch({ A11: A11 as SurveyAnswers['A11'] })}
        />
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <p className="na-intro">
          These questions help us understand what kind of online service would work for residents.
        </p>
        <MultiChoice
          code="B1"
          question="Which devices do you use regularly? Select all that apply."
          value={answers.B1}
          error={errors.B1}
          exclusiveId="none"
          options={[
            { id: 'smartphone', label: 'Smartphone' },
            { id: 'laptop_desktop', label: 'Laptop or desktop computer' },
            { id: 'tablet', label: 'Tablet' },
            { id: 'shared_device', label: 'A shared household device' },
            { id: 'none', label: 'None of these' },
          ]}
          onChange={(B1) => onPatch({ B1 })}
        />
        {!showDeviceDependentItems(answers) && answers.B1?.includes('none') ? (
          <p className="na-hint">{ASSISTED_NOTE}</p>
        ) : null}
        {showDeviceDependentItems(answers) ? (
          <SingleChoice
            code="B2"
            question="What kind of phone do you mainly use?"
            value={typeof answers.B2 === 'string' ? answers.B2 : undefined}
            error={errors.B2}
            options={[
              { id: 'android', label: 'Android' },
              { id: 'ios', label: 'iPhone (iOS)' },
              { id: 'other', label: 'Other' },
              { id: 'no_smartphone', label: 'I do not use a smartphone' },
            ]}
            onChange={(B2) => onPatch({ B2: B2 as SurveyAnswers['B2'] })}
          />
        ) : null}
        <SingleChoice
          code="B3"
          question="How do you mainly get online?"
          value={answers.B3}
          error={errors.B3}
          options={[
            { id: 'wifi_broadband', label: 'Wi-Fi or broadband subscription' },
            { id: 'prepaid_mobile', label: 'Prepaid mobile data (load or promo)' },
            { id: 'postpaid_mobile', label: 'Postpaid mobile data' },
            { id: 'both', label: 'Both Wi-Fi and mobile data' },
            { id: 'no_regular_internet', label: 'I do not have regular internet access' },
          ]}
          onChange={(B3) => onPatch({ B3: B3 as SurveyAnswers['B3'] })}
        />
        <SingleChoice
          code="B4"
          question="How often do you go online?"
          value={answers.B4}
          error={errors.B4}
          options={[
            { id: 'several_times_a_day', label: 'Several times a day' },
            { id: 'about_once_a_day', label: 'About once a day' },
            { id: 'few_times_a_week', label: 'A few times a week' },
            { id: 'about_once_a_week_or_less', label: 'About once a week or less' },
            { id: 'rarely_or_never', label: 'Rarely or never' },
          ]}
          onChange={(B4) => onPatch({ B4: B4 as SurveyAnswers['B4'] })}
        />
        <SingleChoice
          code="B5"
          question="How often do you do transactions online, such as paying bills, submitting forms, or ordering?"
          value={answers.B5}
          error={errors.B5}
          options={[
            { id: 'weekly_or_more', label: 'Weekly or more' },
            { id: 'few_times_a_month', label: 'A few times a month' },
            { id: 'few_times_a_year', label: 'A few times a year' },
            { id: 'never', label: 'Never' },
          ]}
          onChange={(B5) => onPatch({ B5: B5 as SurveyAnswers['B5'] })}
        />
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        {!showDeviceDependentItems(answers) ? <p className="na-hint">{ASSISTED_NOTE}</p> : null}
        <NumberField
          code="B6"
          question="About how much do you spend on mobile data or internet each month, in pesos?"
          value={answers.B6}
          min={0}
          max={10000}
          error={errors.B6}
          onChange={(B6) => onPatch({ B6 })}
        />
        <LikertChoice
          code="B7"
          scale="agreement"
          withNotApplicable
          question="My internet connection is stable enough to finish an online form without interruption."
          value={answers.B7}
          error={errors.B7}
          onChange={(B7) => onPatch({ B7: B7 as SurveyAnswers['B7'] })}
        />
        {showDeviceDependentItems(answers) ? (
          <>
            <LikertChoice
              code="B8"
              scale="agreement"
              withNotApplicable
              question="I avoid installing new apps because of limited phone storage or mobile data."
              value={answers.B8 === 99 ? undefined : answers.B8}
              error={errors.B8}
              onChange={(B8) => onPatch({ B8: B8 as SurveyAnswers['B8'] })}
            />
            <LikertChoice
              code="B9"
              scale="agreement"
              withNotApplicable
              question="I am comfortable opening a website on my phone browser instead of installing an app."
              value={answers.B9 === 99 ? undefined : answers.B9}
              error={errors.B9}
              onChange={(B9) => onPatch({ B9: B9 as SurveyAnswers['B9'] })}
            />
          </>
        ) : null}
      </>
    );
  }

  if (step === 5) {
    return (
      <>
        <p className="na-intro">
          Imagine a website that Camella Homes Tibig residents could open on a phone or computer to
          do some HOA transactions from home. The following questions describe some things this
          website could do. Please tell us how likely you would be to use each one. There are no
          right or wrong answers.
        </p>
        <LikertChoice
          code="F1"
          scale="likelihood"
          question="How likely are you to use online pre-registration for visitors and workers, with a temporary pass?"
          value={answers.F1}
          error={errors.F1}
          onChange={(F1) => onPatch({ F1: F1 as SurveyAnswers['F1'] })}
        />
        <LikertChoice
          code="F2"
          scale="likelihood"
          question="How likely are you to use an online request for street or event closure permits, with notices sent to residents of the affected phase?"
          value={answers.F2}
          error={errors.F2}
          onChange={(F2) => onPatch({ F2: F2 as SurveyAnswers['F2'] })}
        />
        <LikertChoice
          code="F3"
          scale="likelihood"
          question={getF3Wording(answers)}
          value={answers.F3}
          error={errors.F3}
          onChange={(F3) => onPatch({ F3: F3 as SurveyAnswers['F3'] })}
        />
        <LikertChoice
          code="F4"
          scale="likelihood"
          question="How likely are you to use online registration where you upload a photo of a valid ID and the HOA Board verifies it?"
          value={answers.F4}
          error={errors.F4}
          onChange={(F4) => onPatch({ F4: F4 as SurveyAnswers['F4'] })}
        />
        <LikertChoice
          code="F5"
          scale="likelihood"
          question="How likely are you to use an online channel to send requests or concerns to the HOA and track their status?"
          value={answers.F5}
          error={errors.F5}
          onChange={(F5) => onPatch({ F5: F5 as SurveyAnswers['F5'] })}
        />
      </>
    );
  }

  if (step === 6) {
    return (
      <>
        <LikertChoice
          code="F6"
          scale="likelihood"
          question="How likely are you to use a version of the website with adjustable text size, higher contrast, and screen reader support?"
          value={answers.F6}
          error={errors.F6}
          onChange={(F6) => onPatch({ F6: F6 as SurveyAnswers['F6'] })}
        />
        <LikertChoice
          code="F7"
          scale="agreement"
          question="A website with these features would solve some of the problems I face as a resident."
          value={answers.F7}
          error={errors.F7}
          onChange={(F7) => onPatch({ F7: F7 as SurveyAnswers['F7'] })}
        />
        <MultiChoice
          code="F8"
          question="Which of these would you want available first? Select up to 3."
          value={answers.F8}
          error={errors.F8}
          exclusiveId="none_of_these"
          maxNonExclusive={3}
          options={[
            { id: 'pre_registration', label: 'Pre-registration of visitors and workers' },
            { id: 'closure', label: 'Online closure permits and notices' },
            { id: 'forms', label: 'Online forms for owners and tenants' },
            { id: 'registration', label: 'Online registration with ID verification' },
            { id: 'requests', label: 'Online requests with status tracking' },
            { id: 'accessible', label: 'Accessible version of the website' },
            { id: 'none_of_these', label: 'None of these' },
          ]}
          onChange={(F8) => onPatch({ F8 })}
        />
        <MultiChoice
          code="F9"
          question="What might keep you from using this website? Select all that apply."
          value={answers.F9}
          error={errors.F9}
          exclusiveId="nothing_would_stop_me"
          options={[
            { id: 'no_reliable_internet', label: 'No reliable internet' },
            { id: 'not_sure_how', label: 'Not sure how to use it' },
            { id: 'data_worry', label: 'Worried about my personal data' },
            { id: 'prefer_office', label: 'Prefer going to the office' },
            { id: 'no_device', label: 'Do not have a suitable device' },
            { id: 'nothing_would_stop_me', label: 'Nothing would stop me' },
            { id: 'other', label: 'Other' },
          ]}
          onChange={(F9) => onPatch({ F9 })}
        />
        <TextField
          code="F10"
          question="Is there another feature or service you would want from this kind of website?"
          value={answers.F10}
          maxLength={300}
          error={errors.F10}
          onChange={(F10) => onPatch({ F10 })}
        />
      </>
    );
  }

  if (step === 7) {
    return (
      <>
        <p className="na-intro">These questions are about how you reach the HOA today.</p>
        {isOwnerLivingElsewhere(answers) ? <p className="na-hint">{OWNER_NOTE}</p> : null}
        <LikertChoice
          code="S1"
          scale="agreement"
          withNotApplicable
          question="The HOA office hours make it hard for me to do my transactions."
          value={answers.S1}
          error={errors.S1}
          onChange={(S1) => onPatch({ S1: S1 as SurveyAnswers['S1'] })}
        />
        <LikertChoice
          code="S2"
          scale="agreement"
          withNotApplicable
          question="I have to visit the HOA office in person even for simple matters."
          value={answers.S2}
          error={errors.S2}
          onChange={(S2) => onPatch({ S2: S2 as SurveyAnswers['S2'] })}
        />
        <LikertChoice
          code="S3"
          scale="agreement"
          withNotApplicable
          question="I receive a response to my concerns within a reasonable time."
          value={answers.S3}
          error={errors.S3}
          onChange={(S3) => onPatch({ S3: S3 as SurveyAnswers['S3'] })}
        />
      </>
    );
  }

  if (step === 8) {
    return (
      <>
        {isOwnerLivingElsewhere(answers) ? <p className="na-hint">{OWNER_NOTE}</p> : null}
        <MultiChoice
          code="P1"
          question="In the past 3 months, who did you or your household need to bring through the gate? Select all that apply."
          value={answers.P1}
          error={errors.P1}
          exclusiveId="none_of_these"
          options={[
            { id: 'visitors', label: 'Visitors' },
            { id: 'drivers', label: 'Ride-hailing or special-trip drivers' },
            { id: 'deliveries', label: 'Deliveries' },
            { id: 'none_of_these', label: 'None of these' },
          ]}
          onChange={(P1) => onPatch({ P1 })}
        />
        <LikertChoice
          code="P2"
          scale="agreement"
          withNotApplicable
          question="Waiting at the gate to get a permit or pass takes too long for my visitors, workers, or drivers."
          value={answers.P2}
          error={errors.P2}
          onChange={(P2) => onPatch({ P2: P2 as SurveyAnswers['P2'] })}
        />
        <LikertChoice
          code="P3"
          scale="agreement"
          withNotApplicable
          question="Leaving an ID at the gate is inconvenient for my household or guests."
          value={answers.P3}
          error={errors.P3}
          onChange={(P3) => onPatch({ P3: P3 as SurveyAnswers['P3'] })}
        />
        <NumberField
          code="P4"
          question="About how many minutes does a typical wait at the gate take?"
          value={answers.P4}
          min={0}
          max={180}
          error={errors.P4}
          onChange={(P4) => onPatch({ P4 })}
        />
        {showP5(answers) ? (
          <LikertChoice
            code="P5"
            scale="agreement"
            withNotApplicable
            question="Getting my construction or repair workers approved to enter takes too many steps."
            value={answers.P5}
            error={errors.P5}
            onChange={(P5) => onPatch({ P5: P5 as SurveyAnswers['P5'] })}
          />
        ) : null}
      </>
    );
  }

  if (step === 9) {
    return (
      <>
        {isOwnerLivingElsewhere(answers) ? <p className="na-hint">{OWNER_NOTE}</p> : null}
        <SingleChoice
          code="C1"
          question="In the past 12 months, which describes you?"
          value={answers.C1}
          error={errors.C1}
          options={[
            { id: 'requested', label: 'I requested a street or event closure' },
            { id: 'affected', label: 'My household was affected by a closure someone else requested' },
            { id: 'both', label: 'Both' },
            { id: 'neither', label: 'Neither' },
          ]}
          onChange={(C1) => onPatch({ C1: C1 as SurveyAnswers['C1'] })}
        />
        <LikertChoice
          code="C2"
          scale="agreement"
          withNotApplicable
          question="The process of getting a street or event closure permit is clear."
          value={answers.C2}
          error={errors.C2}
          onChange={(C2) => onPatch({ C2: C2 as SurveyAnswers['C2'] })}
        />
        <LikertChoice
          code="C3"
          scale="agreement"
          withNotApplicable
          question="Notices about street closures and rerouting reach me in time."
          value={answers.C3}
          error={errors.C3}
          onChange={(C3) => onPatch({ C3: C3 as SurveyAnswers['C3'] })}
        />
      </>
    );
  }

  if (step === 10) {
    return (
      <>
        <p className="na-intro">
          Some online services need you to register and show a valid ID. These questions are about
          how you feel about that.
        </p>
        <LikertChoice
          code="R1"
          scale="agreement"
          withNotApplicable
          question="I am comfortable uploading a photo of my valid ID to a secure online form."
          value={answers.R1}
          error={errors.R1}
          onChange={(R1) => onPatch({ R1: R1 as SurveyAnswers['R1'] })}
        />
        <LikertChoice
          code="R2"
          scale="agreement"
          withNotApplicable
          question="I trust that only authorized HOA personnel would be able to see my ID."
          value={answers.R2}
          error={errors.R2}
          onChange={(R2) => onPatch({ R2: R2 as SurveyAnswers['R2'] })}
        />
        <SingleChoice
          code="R3"
          question="After my ID has been verified, how long should it be kept?"
          value={answers.R3}
          error={errors.R3}
          options={[
            { id: 'deleted_after_verification', label: 'Deleted right after verification' },
            { id: 'kept_while_resident', label: 'Kept for as long as I live in the subdivision' },
            { id: 'no_preference', label: 'No preference' },
            { id: 'not_sure', label: 'Not sure' },
          ]}
          onChange={(R3) => onPatch({ R3: R3 as SurveyAnswers['R3'] })}
        />
      </>
    );
  }

  if (step === 11 && isHomeownerBranch(answers)) {
    return (
      <>
        <MultiChoice
          code="H1"
          question="Which HOA transactions did your household do in the past 12 months? Select all that apply."
          value={answers.H1}
          error={errors.H1}
          exclusiveId="none"
          options={[
            { id: 'clearance', label: 'Clearance' },
            { id: 'renovation_permit', label: 'Renovation permit' },
            { id: 'vehicle_sticker', label: 'Vehicle sticker' },
            { id: 'billing_dues', label: 'Billing or dues' },
            { id: 'tenant_registration', label: 'Tenant registration or authorization' },
            { id: 'none', label: 'None' },
            { id: 'other', label: 'Other' },
          ]}
          onChange={(H1) => onPatch({ H1 })}
        />
        <LikertChoice
          code="H2"
          scale="agreement"
          withNotApplicable
          question="Completing HOA clearances, forms, and permits needs more office visits than it should."
          value={answers.H2}
          error={errors.H2}
          onChange={(H2) => onPatch({ H2: H2 as SurveyAnswers['H2'] })}
        />
        <LikertChoice
          code="H3"
          scale="agreement"
          withNotApplicable
          question="Registering or authorizing a tenant with the HOA is easy."
          value={answers.H3}
          error={errors.H3}
          onChange={(H3) => onPatch({ H3: H3 as SurveyAnswers['H3'] })}
        />
        <TextField
          code="H4"
          question="Describe one HOA transaction that took the longest, and why."
          value={answers.H4}
          maxLength={300}
          error={errors.H4}
          onChange={(H4) => onPatch({ H4 })}
        />
      </>
    );
  }

  if (step === 11 && isTenantBranch(answers)) {
    return (
      <>
        {TENANT_ANSWERS_NOT_SHARED_WITH_LANDLORD_OR_HOA ? (
          <p className="na-intro">
            Your answers will not be shared with your landlord or the Homeowners Association.
          </p>
        ) : null}
        <MultiChoice
          code="T1"
          question="Which HOA requirements did your household deal with as tenants in the past 12 months? Select all that apply."
          value={answers.T1}
          error={errors.T1}
          exclusiveId="none"
          options={[
            { id: 'tenant_registration', label: 'Tenant registration' },
            { id: 'move_in_clearance', label: 'Move-in clearance' },
            { id: 'visitor_worker_passes', label: 'Visitor or worker passes' },
            { id: 'vehicle_sticker', label: 'Vehicle sticker' },
            { id: 'owner_docs_needed', label: "Forms needing the owner's signature or documents" },
            { id: 'none', label: 'None' },
            { id: 'other', label: 'Other' },
          ]}
          onChange={(T1) => onPatch({ T1 })}
        />
        <LikertChoice
          code="T2"
          scale="agreement"
          withNotApplicable
          question="The HOA's forms and requirements for tenants are clear."
          value={answers.T2}
          error={errors.T2}
          onChange={(T2) => onPatch({ T2: T2 as SurveyAnswers['T2'] })}
        />
        <LikertChoice
          code="T3"
          scale="agreement"
          withNotApplicable
          question="Completing HOA requirements as a tenant takes more steps than it should, such as needing the owner's documents or signature."
          value={answers.T3}
          error={errors.T3}
          onChange={(T3) => onPatch({ T3: T3 as SurveyAnswers['T3'] })}
        />
        <TextField
          code="T4"
          question="Which HOA requirement was hardest for your household as a tenant?"
          value={answers.T4}
          maxLength={300}
          error={errors.T4}
          onChange={(T4) => onPatch({ T4 })}
        />
      </>
    );
  }

  if (step === 11) {
    return (
      <p className="na-error" role="alert">
        Please go back and choose which best describes you.
      </p>
    );
  }

  if (step === 12) {
    return (
      <>
        <p className="na-intro">
          These questions are voluntary. You may choose Prefer not to say for any of them.
        </p>
        <LikertChoice
          code="AC2"
          scale="agreement"
          withNotApplicable
          question="Going to the HOA office in person is difficult for me or for someone in my household."
          value={answers.AC2}
          error={errors.AC2}
          onChange={(AC2) => onPatch({ AC2: AC2 as SurveyAnswers['AC2'] })}
        />
        <LikertChoice
          code="AC3"
          scale="agreement"
          withNotApplicable
          question="Larger text, higher contrast, or screen reader support would help me or someone in my household use an online form."
          value={answers.AC3}
          error={errors.AC3}
          onChange={(AC3) => onPatch({ AC3: AC3 as SurveyAnswers['AC3'] })}
        />
        <SingleChoice
          code="AC4"
          question="If an online service were available, who would use it for the household member who needs help?"
          value={answers.AC4}
          error={errors.AC4}
          options={[
            { id: 'the_person_themselves', label: 'The person themselves' },
            { id: 'family_member', label: 'A family member' },
            { id: 'caregiver_or_rep', label: 'A caregiver or authorized representative' },
            { id: 'not_applicable', label: 'Not applicable' },
          ]}
          onChange={(AC4) => onPatch({ AC4: AC4 as SurveyAnswers['AC4'] })}
        />
      </>
    );
  }

  return (
    <>
      <p className="na-intro">This last part helps us find problems we may have missed.</p>
      <MultiChoice
        code="O1"
        question="Besides what was asked, which of these HOA-related problems have you experienced? Select all that apply."
        value={answers.O1}
        error={errors.O1}
        exclusiveId="none_of_these"
        options={[
          { id: 'garbage', label: 'Garbage collection' },
          { id: 'street_lights', label: 'Street lights' },
          { id: 'roads', label: 'Roads or drainage' },
          { id: 'noise', label: 'Noise or curfew concerns' },
          { id: 'parking', label: 'Parking' },
          { id: 'security', label: 'Security patrol' },
          { id: 'billing', label: 'Billing or dues' },
          { id: 'renovation', label: 'Renovation permits' },
          { id: 'pets', label: 'Pet or animal concerns' },
          { id: 'none_of_these', label: 'None of these' },
          { id: 'other', label: 'Other' },
        ]}
        onChange={(O1) => onPatch({ O1 })}
      />
      {(answers.O1 ?? []).includes('other') ? (
        <TextField
          code="O1_other"
          question="Other problem"
          value={answers.O1_other}
          maxLength={200}
          error={errors.O1_other}
          onChange={(O1_other) => onPatch({ O1_other })}
        />
      ) : null}
      <TextField
        code="O2"
        question="Is there any other problem with HOA services that you would like us to know about?"
        hint="Please do not write names."
        value={answers.O2}
        maxLength={500}
        error={errors.O2}
        onChange={(O2) => onPatch({ O2 })}
      />
    </>
  );
}

export const STEP_TITLES: Record<number, string> = {
  1: 'About your household',
  2: 'About you and how you use HOA services',
  3: 'Digital access',
  4: 'Digital access',
  5: 'Feature interest',
  6: 'Feature interest',
  7: 'Current HOA service access',
  8: 'Entrance, visitor, and worker permits',
  9: 'Street and event closure permits',
  10: 'Registration, ID verification, and data privacy',
  11: 'Your household and the HOA',
  12: 'Accessibility needs',
  13: 'Open problem discovery',
};
