import type { ScreeningData } from '@/survey/schema';

export type ScreeningErrors = Record<string, string>;

const REQUIRED_ALWAYS = [
  'addr_phase',
  'household_size',
  'civil_status',
  'children_yn',
  'sex',
  'age_range',
  'resident_type',
  'pwd_self',
  'pwd_household',
  'primary_channel',
] as const;

const ERROR_COPY: Record<string, string> = {
  addr_phase: 'Please select your phase.',
  household_size: 'Please select your household size.',
  civil_status: 'Please select your civil status.',
  children_yn: 'Please tell us whether there are any minors in your household.',
  children_count: 'Please select how many children are in the household.',
  sex: 'Please select your sex.',
  age_range: 'Please select your age range.',
  resident_type: 'Please select your resident type.',
  pwd_self: 'Please tell us whether you identify as a person with a disability.',
  pwd_household:
    'Please tell us whether a household member has a disability or mobility limitation.',
  disability_type: 'Please select at least one type of disability.',
  primary_channel: 'Please select the primary channel you use for HOA transactions.',
};

/**
 * Screening-step validation. Call only on Continue — not on every keystroke.
 */
export function validateScreeningStep(
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>>,
): ScreeningErrors {
  const errors: ScreeningErrors = {};

  for (const id of REQUIRED_ALWAYS) {
    if (!sc[id]?.trim()) {
      errors[id] = ERROR_COPY[id];
    }
  }

  if (sc.children_yn === 'Yes' && !sc.children_count?.trim()) {
    errors.children_count = ERROR_COPY.children_count;
  }

  if (sc.pwd_self === 'Yes') {
    const selected = Object.keys(multi.disability_type ?? {}).filter(
      (key) => multi.disability_type?.[key],
    );
    if (selected.length === 0) {
      errors.disability_type = ERROR_COPY.disability_type;
    }
  }

  return errors;
}

const CIVIL_STATUS_MAP: Record<string, ScreeningData['civilStatus']> = {
  Single: 'single',
  Married: 'married',
  Widowed: 'widowed',
  Separated: 'separated',
  Divorced: 'divorced',
};

const AGE_RANGE_MAP: Record<string, ScreeningData['ageRange']> = {
  '18–25': '18-25',
  '26–35': '26-35',
  '36–45': '36-45',
  '46–55': '46-55',
  '56 and above': '56+',
};

const RESIDENT_TYPE_MAP: Record<string, ScreeningData['residentType']> = {
  Homeowner: 'homeowner',
  'Renter or lessee': 'renter',
  'Household member of a homeowner': 'household_member',
  'Live-in household staff': 'live_in_staff',
};

const PRIMARY_CHANNEL_MAP: Record<string, ScreeningData['primaryChannel']> = {
  'In person': 'in_person',
  'Online forms downloaded and printed': 'online_print',
  'Through a household member or representative': 'representative',
  'Do not currently transact with the HOA': 'none',
};

const CHILDREN_COUNT_MAP: Record<string, NonNullable<ScreeningData['childrenCount']>> = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4 or more': '4+',
};

/**
 * Map live screening form labels into typed ScreeningData.
 * Every schema field comes from `sc` / `multi` — no fixed stubs.
 */
export function toScreeningData(
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>> = {},
): ScreeningData {
  const householdRaw = sc.household_size ?? '';
  const householdSize = (
    householdRaw === '6 or more' ? '6+' : householdRaw || '1'
  ) as ScreeningData['householdSize'];

  const childrenYn: ScreeningData['childrenYn'] =
    sc.children_yn === 'Yes' ? 'yes' : 'no';

  const childrenCount =
    childrenYn === 'yes' && sc.children_count
      ? CHILDREN_COUNT_MAP[sc.children_count]
      : undefined;

  const disabilityKeys = Object.keys(multi.disability_type ?? {}).filter(
    (key) => multi.disability_type?.[key],
  );

  return {
    addrPhase: sc.addr_phase ?? '',
    addrBlock: sc.addr_block || undefined,
    addrLot: sc.addr_lot || undefined,
    householdSize,
    childrenYn,
    childrenCount,
    civilStatus: CIVIL_STATUS_MAP[sc.civil_status ?? ''] ?? 'single',
    sex: sc.sex === 'Male' ? 'male' : 'female',
    ageRange: AGE_RANGE_MAP[sc.age_range ?? ''] ?? '18-25',
    residentType: RESIDENT_TYPE_MAP[sc.resident_type ?? ''] ?? 'homeowner',
    pwdSelf: sc.pwd_self === 'Yes' ? 'yes' : 'no',
    disabilityType:
      sc.pwd_self === 'Yes' && disabilityKeys.length > 0
        ? disabilityKeys.join(', ')
        : undefined,
    pwdHousehold: sc.pwd_household === 'Yes' ? 'yes' : 'no',
    primaryChannel: PRIMARY_CHANNEL_MAP[sc.primary_channel ?? ''] ?? 'none',
  };
}
