/**
 * One sentence per answer choice, shown under the choice once it is selected.
 * It says in plain words what the choice means, so the respondent can catch a
 * mis-tap. Keyed by question code and option id so instruments saved before
 * this existed still get them. A `note` set on the option itself wins.
 *
 * "Other" choices are left out: they open their own text box.
 */
type Row = [code: string, optionId: string, en: string, fil: string];

const PNTS: [string, string] = ['You chose not to answer this question.', 'Pinili mong huwag sagutin ang tanong na ito.'];

const ROWS: Row[] = [
  // ---- Step 1 ----
  ['A1', '1', 'You are a homeowner and you live in the unit.', 'Ikaw ay may-ari ng bahay at nakatira ka sa unit.'],
  ['A1', '2', 'You own the unit but work abroad, so you do not live in it.', 'Ikaw ang may-ari ng unit ngunit nagtatrabaho ka sa ibang bansa, kaya hindi ka nakatira rito.'],
  ['A1', '3', 'You own the unit but live elsewhere in the Philippines.', 'Ikaw ang may-ari ng unit ngunit nakatira ka sa ibang lugar sa Pilipinas.'],
  ['A1', '4', 'You live in the unit as a family or household member of the homeowner.', 'Nakatira ka sa unit bilang kapamilya o miyembro ng sambahayan ng may-ari.'],
  ['A1', '5', 'You rent or lease the unit.', 'Umuupa ka sa unit.'],
  ['A1', '6', 'You live in the unit as a family or household member of the tenant.', 'Nakatira ka sa unit bilang kapamilya o miyembro ng sambahayan ng nangungupahan.'],

  ['A3', '1', 'One person lives in the unit.', 'Isang tao ang nakatira sa unit.'],
  ['A3', '2', 'Two people live in the unit.', 'Dalawang tao ang nakatira sa unit.'],
  ['A3', '3', 'Three people live in the unit.', 'Tatlong tao ang nakatira sa unit.'],
  ['A3', '4', 'Four people live in the unit.', 'Apat na tao ang nakatira sa unit.'],
  ['A3', '5', 'Five people live in the unit.', 'Limang tao ang nakatira sa unit.'],
  ['A3', '6+', 'Six or more people live in the unit.', 'Anim o higit pang tao ang nakatira sa unit.'],
  ['A3', 'No one lives in the unit right now', 'The unit is empty right now.', 'Walang nakatira sa unit sa ngayon.'],

  ['A2', 'Phase 1', 'Your unit is in Phase 1.', 'Ang unit mo ay nasa Phase 1.'],
  ['A2', 'Phase 2', 'Your unit is in Phase 2.', 'Ang unit mo ay nasa Phase 2.'],
  ['A2', 'Phase 3', 'Your unit is in Phase 3.', 'Ang unit mo ay nasa Phase 3.'],
  ['A2', 'Phase 4 Heights', 'Your unit is in Phase 4 Heights.', 'Ang unit mo ay nasa Phase 4 Heights.'],
  ['A2', 'Phase 5 Highlands', 'Your unit is in Phase 5 Highlands.', 'Ang unit mo ay nasa Phase 5 Highlands.'],
  ['A2', 'Phase 6 Eastgrove', 'Your unit is in Phase 6 Eastgrove.', 'Ang unit mo ay nasa Phase 6 Eastgrove.'],

  ['A4', 'yes', 'You or someone in your household has a disability or mobility limitation.', 'May kapansanan o limitasyon sa paggalaw ka o ang isang miyembro ng sambahayan mo.'],
  ['A4', 'no', 'No one in your household has a disability or mobility limitation.', 'Walang miyembro ng sambahayan mo na may kapansanan o limitasyon sa paggalaw.'],
  ['A4', 'prefer_not_to_say', ...PNTS],

  ['A5', 'yes', 'Outside workers entered the subdivision for work on your home in the past 12 months.', 'May mga manggagawa mula sa labas na pumasok sa subdivision para sa gawain sa bahay mo sa nakalipas na 12 buwan.'],
  ['A5', 'no', 'No outside workers were needed for your home in the past 12 months.', 'Walang manggagawa mula sa labas na kinailangan para sa bahay mo sa nakalipas na 12 buwan.'],

  ['AC1', 'difficulty_walking_climbing', 'Walking or climbing stairs is difficult.', 'Mahirap ang maglakad o umakyat ng hagdan.'],
  ['AC1', 'uses_wheelchair_or_aid', 'A wheelchair or mobility aid is used.', 'May gumagamit ng wheelchair o gamit pantulong sa paggalaw.'],
  ['AC1', 'difficulty_seeing', 'Seeing is difficult.', 'Mahirap ang makakita.'],
  ['AC1', 'difficulty_hearing', 'Hearing is difficult.', 'Mahirap ang makarinig.'],
  ['AC1', 'difficulty_reading_forms', 'Reading or understanding forms is difficult.', 'Mahirap ang magbasa o umunawa ng mga form.'],
  ['AC1', 'prefer_not_to_say', ...PNTS],

  // ---- Step 2 ----
  ['A6', '18-24', 'You are between 18 and 24 years old.', 'Ikaw ay nasa pagitan ng 18 at 24 taong gulang.'],
  ['A6', '25-34', 'You are between 25 and 34 years old.', 'Ikaw ay nasa pagitan ng 25 at 34 taong gulang.'],
  ['A6', '35-44', 'You are between 35 and 44 years old.', 'Ikaw ay nasa pagitan ng 35 at 44 taong gulang.'],
  ['A6', '45-54', 'You are between 45 and 54 years old.', 'Ikaw ay nasa pagitan ng 45 at 54 taong gulang.'],
  ['A6', '55-64', 'You are between 55 and 64 years old.', 'Ikaw ay nasa pagitan ng 55 at 64 taong gulang.'],
  ['A6', '65+', 'You are 65 years old or older.', 'Ikaw ay 65 taong gulang pataas.'],
  ['A6', 'prefer_not_to_say', ...PNTS],

  ['A7', 'female', 'You identify as female.', 'Babae ang pagkilala mo sa sarili.'],
  ['A7', 'male', 'You identify as male.', 'Lalaki ang pagkilala mo sa sarili.'],
  ['A7', 'prefer_not_to_say', ...PNTS],

  ['A8', 'single', 'You are single.', 'Ikaw ay single.'],
  ['A8', 'married', 'You are married.', 'Ikaw ay may asawa.'],
  ['A8', 'living_with_partner', 'You live with a partner.', 'Kasama mong nakatira ang iyong kinakasama.'],
  ['A8', 'widowed', 'You are widowed.', 'Ikaw ay biyudo o biyuda.'],
  ['A8', 'separated', 'You are separated.', 'Ikaw ay hiwalay sa asawa.'],
  ['A8', 'prefer_not_to_say', ...PNTS],

  ['A10', 'i_do', 'You usually handle HOA transactions yourself.', 'Ikaw mismo ang karaniwang nag-aasikaso ng mga transaksyon sa HOA.'],
  ['A10', 'household_member', 'Another member of your household usually handles them.', 'Isa pang miyembro ng sambahayan ang karaniwang nag-aasikaso.'],
  ['A10', 'caregiver_or_rep', 'A caregiver, helper, or representative usually handles them.', 'Isang tagapag-alaga, katulong, o kinatawan ang karaniwang nag-aasikaso.'],
  ['A10', 'owner_or_landlord', 'The property owner or landlord usually handles them.', 'Ang may-ari ng ari-arian o landlord ang karaniwang nag-aasikaso.'],
  ['A10', 'it_varies', 'Who handles them changes from time to time.', 'Nag-iiba kung sino ang nag-aasikaso.'],

  ['A11', 'walk_in', 'You mainly go to the HOA office in person.', 'Karaniwan kang pumupunta nang personal sa opisina ng HOA.'],
  ['A11', 'phone', 'You mainly call the HOA.', 'Karaniwan kang tumatawag sa HOA.'],
  ['A11', 'facebook', 'You mainly use the HOA Facebook page or messages.', 'Karaniwan mong ginagamit ang Facebook page o mga mensahe ng HOA.'],
  ['A11', 'email_or_website', 'You mainly use email or a website.', 'Karaniwan mong ginagamit ang email o website.'],
  ['A11', 'through_neighbor_or_officer', 'You mainly go through a neighbor or an HOA officer.', 'Karaniwan kang dumadaan sa kapitbahay o opisyal ng HOA.'],
  ['A11', 'no_transaction_yet', 'You have not done any HOA transaction yet.', 'Wala ka pang nagagawang transaksyon sa HOA.'],

  // ---- Step 3 ----
  ['B1', 'smartphone', 'You use a smartphone regularly.', 'Regular kang gumagamit ng smartphone.'],
  ['B1', 'laptop_desktop', 'You use a laptop or desktop computer regularly.', 'Regular kang gumagamit ng laptop o desktop computer.'],
  ['B1', 'tablet', 'You use a tablet regularly.', 'Regular kang gumagamit ng tablet.'],
  ['B1', 'shared_device', 'You use a device that your household shares.', 'Gumagamit ka ng device na pinagsasaluhan ng sambahayan.'],
  ['B1', 'none', 'You do not regularly use any of these devices.', 'Hindi ka regular na gumagamit ng alinman sa mga device na ito.'],

  ['B2', 'android', 'Your main phone is an Android phone.', 'Android phone ang pangunahin mong telepono.'],
  ['B2', 'ios', 'Your main phone is an iPhone.', 'iPhone ang pangunahin mong telepono.'],
  ['B2', 'no_smartphone', 'You do not use a smartphone.', 'Hindi ka gumagamit ng smartphone.'],

  ['B3', 'wifi_broadband', 'You mainly get online through a Wi-Fi or broadband subscription.', 'Karaniwan kang nagoonline gamit ang subscription sa Wi-Fi o broadband.'],
  ['B3', 'prepaid_mobile', 'You mainly get online with prepaid mobile data.', 'Karaniwan kang nagoonline gamit ang prepaid na mobile data.'],
  ['B3', 'postpaid_mobile', 'You mainly get online with postpaid mobile data.', 'Karaniwan kang nagoonline gamit ang postpaid na mobile data.'],
  ['B3', 'both', 'You use both Wi-Fi and mobile data.', 'Gumagamit ka ng parehong Wi-Fi at mobile data.'],
  ['B3', 'no_regular_internet', 'You do not have regular internet access.', 'Wala kang regular na access sa internet.'],

  ['B4', 'several_times_a_day', 'You go online several times a day.', 'Nagoonline ka nang ilang beses sa isang araw.'],
  ['B4', 'about_once_a_day', 'You go online about once a day.', 'Nagoonline ka nang mga isang beses kada araw.'],
  ['B4', 'few_times_a_week', 'You go online a few times a week.', 'Nagoonline ka nang ilang beses kada linggo.'],
  ['B4', 'about_once_a_week_or_less', 'You go online about once a week or less.', 'Nagoonline ka nang mga isang beses kada linggo o mas madalang.'],
  ['B4', 'rarely_or_never', 'You rarely or never go online.', 'Bihira o hindi ka nagoonline.'],

  ['B5', 'weekly_or_more', 'You do online transactions every week or more often.', 'Gumagawa ka ng online na transaksyon lingguhan o mas madalas.'],
  ['B5', 'few_times_a_month', 'You do online transactions a few times a month.', 'Gumagawa ka ng online na transaksyon nang ilang beses kada buwan.'],
  ['B5', 'few_times_a_year', 'You do online transactions a few times a year.', 'Gumagawa ka ng online na transaksyon nang ilang beses kada taon.'],
  ['B5', 'never', 'You never do online transactions.', 'Hindi ka kailanman gumagawa ng online na transaksyon.'],

  // ---- Step 4 ----
  ['B6', 'none', 'You spend nothing on mobile data or internet.', 'Wala kang ginugugol sa mobile data o internet.'],
  ['B6', 'under_100', 'You spend under ₱100 a month.', 'Wala pang ₱100 ang ginugugol mo kada buwan.'],
  ['B6', '100_299', 'You spend ₱100 to ₱299 a month.', 'Gumugugol ka ng ₱100 hanggang ₱299 kada buwan.'],
  ['B6', '300_499', 'You spend ₱300 to ₱499 a month.', 'Gumugugol ka ng ₱300 hanggang ₱499 kada buwan.'],
  ['B6', '500_999', 'You spend ₱500 to ₱999 a month.', 'Gumugugol ka ng ₱500 hanggang ₱999 kada buwan.'],
  ['B6', '1000_1999', 'You spend ₱1,000 to ₱1,999 a month.', 'Gumugugol ka ng ₱1,000 hanggang ₱1,999 kada buwan.'],
  ['B6', '2000_plus', 'You spend ₱2,000 or more a month.', 'Gumugugol ka ng ₱2,000 o higit pa kada buwan.'],
  ['B6', 'not_sure', 'You are not sure how much you spend.', 'Hindi ka sigurado kung magkano ang ginugugol mo.'],

  // ---- Step 6 ----
  ['F8', 'pre_registration', 'You want online pre-registration of visitors and workers first.', 'Gusto mong unang magamit ang online na pre-registration ng mga bisita at manggagawa.'],
  ['F8', 'closure', 'You want online closure permits and notices first.', 'Gusto mong unang magamit ang online na permit sa pagsasara at mga abiso.'],
  ['F8', 'forms', 'You want online forms for owners and tenants first.', 'Gusto mong unang magamit ang online na form para sa mga may-ari at nangungupahan.'],
  ['F8', 'registration', 'You want online registration with ID verification first.', 'Gusto mong unang magamit ang online na pagpaparehistro na may beripikasyon ng ID.'],
  ['F8', 'requests', 'You want online requests with status tracking first.', 'Gusto mong unang magamit ang online na request na may pagsubaybay sa katayuan.'],
  ['F8', 'accessible', 'You want the accessible version of the website first.', 'Gusto mong unang magamit ang accessible na bersyon ng website.'],
  ['F8', 'none_of_these', 'None of these features is a priority for you.', 'Wala sa mga tampok na ito ang prayoridad mo.'],

  ['F9', 'no_reliable_internet', 'Unreliable internet could keep you from using it.', 'Maaaring hindi mo ito magamit dahil sa hindi maaasahang internet.'],
  ['F9', 'not_sure_how', 'Not knowing how to use it could keep you from using it.', 'Maaaring hindi mo ito magamit dahil hindi mo alam kung paano.'],
  ['F9', 'data_worry', 'Worry about your personal data could keep you from using it.', 'Maaaring hindi mo ito magamit dahil sa pag-aalala sa iyong personal na datos.'],
  ['F9', 'prefer_office', 'You would rather go to the office.', 'Mas gusto mong pumunta sa opisina.'],
  ['F9', 'no_device', 'You do not have a suitable device.', 'Wala kang angkop na device.'],
  ['F9', 'nothing_would_stop_me', 'Nothing would stop you from using it.', 'Walang hahadlang sa iyo para gamitin ito.'],

  // ---- Step 8 ----
  ['P1', 'visitors', 'You needed to bring visitors through the gate.', 'Kinailangan mong papasukin ang mga bisita sa gate.'],
  ['P1', 'drivers', 'You needed to bring ride-hailing or special-trip drivers through the gate.', 'Kinailangan mong papasukin ang mga driver ng ride-hailing o special trip sa gate.'],
  ['P1', 'deliveries', 'You needed to bring deliveries through the gate.', 'Kinailangan mong papasukin ang mga delivery sa gate.'],
  ['P1', 'none_of_these', 'You did not need to bring anyone through the gate.', 'Wala kang kinailangang papasukin sa gate.'],

  // ---- Step 9 ----
  ['C1', 'requested', 'You requested a street or event closure.', 'Humiling ka ng pagsasara ng kalye o event.'],
  ['C1', 'affected', 'A closure that someone else requested affected your household.', 'Naapektuhan ang sambahayan mo ng pagsasarang hiniling ng iba.'],
  ['C1', 'both', 'You requested a closure and were also affected by one.', 'Humiling ka ng pagsasara at naapektuhan ka rin ng isa.'],
  ['C1', 'neither', 'You were not involved in any closure.', 'Hindi ka nasangkot sa anumang pagsasara.'],

  // ---- Step 10 ----
  ['R3', 'deleted_after_verification', 'You want your ID deleted right after it is verified.', 'Gusto mong mabura ang ID mo kaagad pagkatapos itong maberipika.'],
  ['R3', 'kept_while_resident', 'You are fine with your ID being kept while you live in the subdivision.', 'Ayos lang sa iyo na itago ang ID mo habang nakatira ka sa subdivision.'],
  ['R3', 'no_preference', 'You have no preference on how long your ID is kept.', 'Wala kang kagustuhan kung gaano katagal itatago ang ID mo.'],
  ['R3', 'not_sure', 'You are not sure how long your ID should be kept.', 'Hindi ka sigurado kung gaano katagal dapat itago ang ID mo.'],

  // ---- Step 11 ----
  ['H1', 'clearance', 'Your household got a clearance.', 'Kumuha ng clearance ang sambahayan mo.'],
  ['H1', 'renovation_permit', 'Your household applied for a renovation permit.', 'Nag-apply ang sambahayan mo ng permit sa renovation.'],
  ['H1', 'vehicle_sticker', 'Your household got a vehicle sticker.', 'Kumuha ng sticker ng sasakyan ang sambahayan mo.'],
  ['H1', 'billing_dues', 'Your household dealt with billing or dues.', 'Nag-asikaso ang sambahayan mo ng billing o dues.'],
  ['H1', 'tenant_registration', 'Your household registered or authorized a tenant.', 'Nagparehistro o nagbigay ng pahintulot sa nangungupahan ang sambahayan mo.'],
  ['H1', 'none', 'Your household did none of these transactions.', 'Wala sa mga transaksyong ito ang ginawa ng sambahayan mo.'],

  ['T1', 'tenant_registration', 'Your household had to register as tenants.', 'Kinailangang magparehistro ang sambahayan mo bilang nangungupahan.'],
  ['T1', 'move_in_clearance', 'Your household got a move-in clearance.', 'Kumuha ng move-in clearance ang sambahayan mo.'],
  ['T1', 'visitor_worker_passes', 'Your household got visitor or worker passes.', 'Kumuha ng pass ng bisita o manggagawa ang sambahayan mo.'],
  ['T1', 'vehicle_sticker', 'Your household got a vehicle sticker.', 'Kumuha ng sticker ng sasakyan ang sambahayan mo.'],
  ['T1', 'owner_docs_needed', "A form needed the owner's signature or documents.", 'May form na nangailangan ng pirma o dokumento ng may-ari.'],
  ['T1', 'none', 'Your household dealt with none of these requirements.', 'Wala sa mga requirement na ito ang hinarap ng sambahayan mo.'],

  // ---- Step 12 ----
  ['AC4', 'the_person_themselves', 'The person themselves would use it.', 'Ang taong mismo ang gagamit nito.'],
  ['AC4', 'family_member', 'A family member would use it for them.', 'Isang kapamilya ang gagamit nito para sa kanila.'],
  ['AC4', 'caregiver_or_rep', 'A caregiver or authorized representative would use it for them.', 'Isang tagapag-alaga o awtorisadong kinatawan ang gagamit nito para sa kanila.'],
  ['AC4', 'not_applicable', 'This does not apply to your household.', 'Hindi ito naaangkop sa sambahayan mo.'],

  // ---- Step 13 ----
  ['IV1', 'yes', 'You are open to a possible follow-up interview.', 'Bukas ka sa posibleng follow-up na panayam.'],
  ['IV1', 'no', 'You prefer not to be contacted for an interview.', 'Mas gusto mong huwag makontak para sa panayam.'],
];

export const OPTION_NOTES: Record<string, Record<string, string>> = {};
export const OPTION_NOTES_FIL: Record<string, string> = {};
for (const [code, id, en, fil] of ROWS) {
  (OPTION_NOTES[code] ??= {})[id] = en;
  OPTION_NOTES_FIL[en] = fil;
}

/** What each scale answer means, for the line under the scale. */
export const SCALE_NOTES = {
  agreement: [
    '',
    'You strongly disagree with this statement.',
    'You disagree with this statement.',
    'You are neutral about this statement.',
    'You agree with this statement.',
    'You strongly agree with this statement.',
  ],
  likelihood: [
    '',
    'You are very unlikely to use this.',
    'You are unlikely to use this.',
    'You are not sure whether you would use this.',
    'You are likely to use this.',
    'You are very likely to use this.',
  ],
  notApplicable: 'This does not apply to you.',
} as const;

export const SCALE_NOTES_FIL: Record<string, string> = {
  'You strongly disagree with this statement.': 'Mahigpit kang hindi sumasang-ayon sa pahayag na ito.',
  'You disagree with this statement.': 'Hindi ka sumasang-ayon sa pahayag na ito.',
  'You are neutral about this statement.': 'Neutral ka sa pahayag na ito.',
  'You agree with this statement.': 'Sumasang-ayon ka sa pahayag na ito.',
  'You strongly agree with this statement.': 'Lubos kang sumasang-ayon sa pahayag na ito.',
  'You are very unlikely to use this.': 'Napakaliit ng posibilidad na gamitin mo ito.',
  'You are unlikely to use this.': 'Maliit ang posibilidad na gamitin mo ito.',
  'You are not sure whether you would use this.': 'Hindi ka sigurado kung gagamitin mo ito.',
  'You are likely to use this.': 'Malaki ang posibilidad na gamitin mo ito.',
  'You are very likely to use this.': 'Napakalaki ng posibilidad na gamitin mo ito.',
  'This does not apply to you.': 'Hindi ito naaangkop sa iyo.',
  'Not applicable': 'Hindi naaangkop',
  'You have experienced this:': 'Naranasan mo ito:',
  'You have experienced problems with:': 'Nakaranas ka ng mga problema sa:',
};

export function optionNote(code: string, optionId: string): string | undefined {
  return OPTION_NOTES[code]?.[optionId];
}

/** First letter lower-cased, unless the word is an acronym such as HOA or Wi-Fi. */
export function lowerFirst(text: string): string {
  if (text.length < 2) return text.toLowerCase();
  return /^[A-Z][A-Z-]/.test(text) || /^Wi-Fi/.test(text) ? text : text[0]!.toLowerCase() + text.slice(1);
}
