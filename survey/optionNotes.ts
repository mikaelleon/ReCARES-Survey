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
  ['F8', 'forms', 'You want online forms to register or authorize your tenant first.', 'Gusto mong unang magamit ang online na form para irehistro o pahintulutan ang iyong nangungupahan.'],
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

/**
 * Plain-language guidance appended to a choice's one-sentence note: who should pick it and who
 * should not. Written as direct advice ("Choose this if ...") so a respondent can check their
 * own situation. Keyed `code|optionId`. Choices that are self-evident (age bands, phases,
 * spending ranges, "none", "prefer not to say") are left out on purpose.
 */
type Guidance = [en: string, fil: string];

const GUIDANCE: Record<string, Guidance> = {
  // ---- Step 1 ----
  'A1|1': [
    'Choose this if you or your family own the home, even if it is still being paid by installment. Do not choose this if you rent the unit.',
    'Piliin ito kung ikaw o ang pamilya mo ang may-ari ng bahay, kahit hinuhulugan pa. Huwag piliin ito kung umuupa ka sa unit.',
  ],
  'A1|2': [
    'Choose this if you own the unit and work overseas (OFW) while it stays empty or is used by others. Do not choose this if you only travel abroad for a short trip.',
    'Piliin ito kung ikaw ang may-ari ng unit at nagtatrabaho sa ibang bansa (OFW) habang walang tao o ibang tao ang gumagamit nito. Huwag piliin ito kung saglit ka lang bumiyahe sa ibang bansa.',
  ],
  'A1|3': [
    'Choose this if you own the unit but live in another city, province, or house in the Philippines. Do not choose this if you live in this subdivision.',
    'Piliin ito kung ikaw ang may-ari ng unit pero nakatira ka sa ibang lungsod, probinsya, o bahay sa Pilipinas. Huwag piliin ito kung nakatira ka sa subdivision na ito.',
  ],
  'A1|4': [
    "Choose this if you are the owner's spouse, child, parent, or relative living in the unit. Do not choose this if you are a tenant.",
    'Piliin ito kung ikaw ang asawa, anak, magulang, o kamag-anak ng may-ari na nakatira sa unit. Huwag piliin ito kung nangungupahan ka.',
  ],
  'A1|5': [
    'Choose this if you pay monthly rent or a lease to the owner, including rent-to-own. Do not choose this if you stay for free with relatives.',
    'Piliin ito kung nagbabayad ka ng buwanang upa o lease sa may-ari, pati rent-to-own. Huwag piliin ito kung libre kang tumutuloy sa mga kamag-anak.',
  ],
  'A1|6': [
    'Choose this if you are the spouse, child, or relative of the person renting the unit. Do not choose this if you signed the lease yourself.',
    'Piliin ito kung ikaw ang asawa, anak, o kamag-anak ng nangungupahan sa unit. Huwag piliin ito kung ikaw mismo ang pumirma ng lease.',
  ],

  // ---- Step 1: accessibility screening ----
  'A4|yes': [
    'Choose this for lasting or short-term difficulty with walking, seeing, hearing, or reading forms, including a recent injury or an illness, and even if a cane, wheelchair, or hearing aid helps. Do not choose this if ordinary reading glasses fully fix your sight.',
    'Piliin ito kung may pangmatagalan o pansamantalang hirap sa paglalakad, pagtingin, pandinig, o pagbasa ng mga form, pati kamakailang pinsala o sakit, at kahit may tumutulong na tungkod, wheelchair, o hearing aid. Huwag piliin ito kung lubos na naaayos ng karaniwang salamin sa pagbasa ang paningin mo.',
  ],
  'A4|no': [
    'Choose this if everyone in your household can walk, see, hear, and read forms without difficulty, whether lasting or short-term.',
    'Piliin ito kung kayang maglakad, makakita, makarinig, at magbasa ng mga form ng lahat sa sambahayan mo nang walang hirap, pangmatagalan man o pansamantala.',
  ],

  'A5|yes': [
    'Choose this if contractors, masons, electricians, plumbers, painters, or materials deliveries came in for repairs or renovation. Do not choose this for your own family or live-in helpers.',
    'Piliin ito kung may pumasok na kontratista, mason, electrician, tubero, pintor, o paghahatid ng materyales para sa pagkukumpuni o renovation. Huwag piliin ito para sa sarili mong pamilya o kasambahay na kasama sa bahay.',
  ],
  'A5|no': [
    'Choose this if no work was done on your home, or only your own household did it. Do not choose this if any outside worker came, even for one day.',
    'Piliin ito kung walang ginawa sa bahay mo, o ang sarili mo lang na sambahayan ang gumawa. Huwag piliin ito kung may manggagawa mula sa labas na dumating, kahit isang araw lang.',
  ],

  'AC1|difficulty_walking_climbing': [
    'Choose this if you need to rest or hold a rail on stairs, or if a knee, hip, or back problem, a sprain, or a recent injury makes walking hard, whether lasting or short-term.',
    'Piliin ito kung kailangan mong magpahinga o humawak sa barandilya sa hagdan, o kung nahihirapang maglakad dahil sa problema sa tuhod, balakang, o likod, pilay, o kamakailang pinsala, pangmatagalan man o pansamantala.',
  ],
  'AC1|uses_wheelchair_or_aid': [
    'Choose this if you use a wheelchair, walker, crutches, or a cane, whether regularly or only while an injury heals. Do not choose this for a stroller.',
    'Piliin ito kung gumagamit ka ng wheelchair, walker, saklay, o tungkod, regular man o habang gumagaling lang ang pinsala. Huwag piliin ito para sa stroller.',
  ],
  'AC1|difficulty_seeing': [
    'Choose this for low vision or blindness that glasses do not fully fix, trouble reading small print on screens or notices, or a short-term eye problem. Do not choose this if ordinary glasses fully fix your sight.',
    'Piliin ito kung malabo ang paningin o bulag na hindi lubos na naaayos ng salamin, hirap magbasa ng maliliit na letra sa screen o abiso, o pansamantalang problema sa mata. Huwag piliin ito kung lubos na naaayos ng karaniwang salamin ang paningin mo.',
  ],
  'AC1|difficulty_hearing': [
    'Choose this for hearing loss, using a hearing aid, often asking people to repeat themselves, or a short-term problem such as a blocked ear or infection. Do not choose this if noise only makes it hard to hear for a moment.',
    'Piliin ito kung may pagkawala ng pandinig, gumagamit ng hearing aid, madalas magpaulit sa kausap, o may pansamantalang problema tulad ng barado ang tenga o impeksyon. Huwag piliin ito kung saglit lang nahihirapang makarinig dahil sa ingay.',
  ],
  'AC1|difficulty_reading_forms': [
    'Choose this if you have trouble reading, a learning difficulty, or need help to understand official forms. Do not choose this if you simply find a form long or tiring.',
    'Piliin ito kung nahihirapan kang magbasa, may learning difficulty, o kailangan ng tulong para maunawaan ang opisyal na form. Huwag piliin ito kung nakikita mo lang na mahaba o nakakapagod ang form.',
  ],

  'A8|single': [
    'Choose this if you have never married and do not live with a partner. Do not choose this if you live with a partner.',
    'Piliin ito kung hindi ka pa kailanman ikinasal at hindi mo kasamang nakatira ang kinakasama. Huwag piliin ito kung kasama mong nakatira ang kinakasama.',
  ],
  'A8|living_with_partner': [
    'Choose this if you live together without being married. Do not choose this if you are legally married.',
    'Piliin ito kung magkasama kayong nakatira nang hindi kasal. Huwag piliin ito kung legal kayong kasal.',
  ],
  'A8|separated': [
    'Choose this if you live apart from your spouse, legally or not. Do not choose this if your spouse has passed away.',
    'Piliin ito kung hiwalay kayong nakatira ng asawa mo, legal man o hindi. Huwag piliin ito kung pumanaw na ang asawa mo.',
  ],

  'A10|i_do': [
    'Choose this if you ask for clearances, apply for vehicle stickers, or visit the HOA office for the household yourself. Do not choose this if someone else does it for you.',
    'Piliin ito kung ikaw mismo ang humihingi ng clearance, nag-aapply ng sticker ng sasakyan, o pumupunta sa opisina ng HOA para sa sambahayan. Huwag piliin ito kung iba ang gumagawa para sa iyo.',
  ],
  'A10|household_member': [
    'Choose this if a spouse, child, parent, or sibling who lives with you handles it. Do not choose this for a hired helper.',
    'Piliin ito kung asawa, anak, magulang, o kapatid na kasama mong nakatira ang nag-aasikaso. Huwag piliin ito para sa upahang katulong.',
  ],
  'A10|caregiver_or_rep': [
    'Choose this if a helper, caregiver, property manager, or anyone with your authorization letter handles it. Do not choose this for a family member.',
    'Piliin ito kung katulong, tagapag-alaga, property manager, o sinumang may authorization letter mula sa iyo ang nag-aasikaso. Huwag piliin ito para sa kapamilya.',
  ],
  'A10|owner_or_landlord': [
    'Choose this if the owner handles HOA matters for a unit you rent. Do not choose this if you are the owner and handle them yourself.',
    'Piliin ito kung ang may-ari ang nag-aasikaso ng HOA para sa unit na inuupahan mo. Huwag piliin ito kung ikaw ang may-ari at ikaw mismo ang nag-aasikaso.',
  ],

  'A11|walk_in': [
    'Choose this if you visit the HOA office to ask questions or submit forms. Do not choose this if you only pass by the office.',
    'Piliin ito kung pumupunta ka sa opisina ng HOA para magtanong o magsumite ng form. Huwag piliin ito kung dumadaan ka lang sa opisina.',
  ],
  'A11|phone': [
    'Choose this if you call or text the HOA. Do not choose this for Facebook messages.',
    'Piliin ito kung tumatawag o nagte-text ka sa HOA. Huwag piliin ito para sa mga mensahe sa Facebook.',
  ],
  'A11|facebook': [
    'Choose this if you message or comment on the HOA Facebook page, or use its group chat. Do not choose this for calls or texts.',
    'Piliin ito kung nagme-message o nagko-comment ka sa Facebook page ng HOA, o gumagamit ng group chat nito. Huwag piliin ito para sa mga tawag o text.',
  ],
  'A11|email_or_website': [
    'Choose this if you email the HOA or use a form on its website. Do not choose this for Facebook messages.',
    'Piliin ito kung nag-eemail ka sa HOA o gumagamit ng form sa website nito. Huwag piliin ito para sa mga mensahe sa Facebook.',
  ],
  'A11|through_neighbor_or_officer': [
    'Choose this if you ask a neighbor or an HOA officer to pass your request along. Do not choose this if you contact the HOA office yourself.',
    'Piliin ito kung nakikiusap ka sa kapitbahay o opisyal ng HOA na ipaabot ang request mo. Huwag piliin ito kung ikaw mismo ang kumokontak sa opisina ng HOA.',
  ],
  'A11|no_transaction_yet': [
    'Choose this if you have never asked for a clearance or sticker, submitted a form, or made any request to the HOA. Do not choose this if you have done any transaction, even a long time ago.',
    'Piliin ito kung hindi ka pa kailanman humingi ng clearance o sticker, nagsumite ng form, o nag-request sa HOA. Huwag piliin ito kung may nagawa ka nang anumang transaksyon, kahit matagal na.',
  ],

  // ---- Step 3 ----
  'B1|smartphone': [
    'Choose this if you use an Android phone or iPhone most days. Do not choose this for a basic keypad phone.',
    'Piliin ito kung gumagamit ka ng Android phone o iPhone halos araw-araw. Huwag piliin ito para sa simpleng keypad na telepono.',
  ],
  'B1|laptop_desktop': [
    'Choose this if you regularly use a laptop or desktop PC, including one from school or work. Do not choose this if you have used one only once or twice.',
    'Piliin ito kung regular kang gumagamit ng laptop o desktop PC, pati ang galing sa paaralan o trabaho. Huwag piliin ito kung minsan o dalawang beses mo lang itong nagamit.',
  ],
  'B1|tablet': [
    'Choose this if you use an iPad or Android tablet. Do not choose this for a phone with a large screen.',
    'Piliin ito kung gumagamit ka ng iPad o Android tablet. Huwag piliin ito para sa telepono na malaki ang screen.',
  ],
  'B1|shared_device': [
    'Choose this if your family shares a phone or computer and you take turns using it. Do not choose this if only you use the device.',
    'Piliin ito kung may telepono o computer na pinagsasaluhan ng pamilya at salitan ninyong ginagamit. Huwag piliin ito kung ikaw lang ang gumagamit ng device.',
  ],
  'B1|none': [
    'Choose this if you have no phone, computer, or tablet you can use regularly, and only borrow one once in a while. Do not choose this if you can use a device most days.',
    'Piliin ito kung wala kang telepono, computer, o tablet na regular mong magagamit, at minsan lang humiram. Huwag piliin ito kung may device kang magagamit halos araw-araw.',
  ],

  'B2|android': [
    'Choose this for phones such as Samsung, Oppo, Vivo, Xiaomi, Realme, Infinix, or Huawei. Do not choose this for an iPhone.',
    'Piliin ito para sa mga telepono tulad ng Samsung, Oppo, Vivo, Xiaomi, Realme, Infinix, o Huawei. Huwag piliin ito para sa iPhone.',
  ],
  'B2|ios': [
    'Choose this for any iPhone, new or old. Do not choose this for an Android phone or an iPad.',
    'Piliin ito para sa anumang iPhone, bago man o luma. Huwag piliin ito para sa Android phone o iPad.',
  ],

  'B3|wifi_broadband': [
    'Choose this if you have a fiber, DSL, or home Wi-Fi subscription at home. Do not choose this if you only use mobile data on your phone.',
    'Piliin ito kung may subscription ka sa fiber, DSL, o home Wi-Fi sa bahay. Huwag piliin ito kung mobile data lang sa telepono ang ginagamit mo.',
  ],
  'B3|prepaid_mobile': [
    'Choose this if you buy load or data promos for your phone. Do not choose this for a monthly postpaid plan.',
    'Piliin ito kung bumibili ka ng load o data promo para sa telepono mo. Huwag piliin ito para sa buwanang postpaid na plano.',
  ],
  'B3|postpaid_mobile': [
    'Choose this if your phone plan is billed to you every month. Do not choose this if you buy prepaid load.',
    'Piliin ito kung sinisingil sa iyo kada buwan ang plano mo sa telepono. Huwag piliin ito kung bumibili ka ng prepaid na load.',
  ],
  'B3|no_regular_internet': [
    'Choose this if you are rarely online, or only use free Wi-Fi outside your home. Do not choose this if your connection works for you most days.',
    'Piliin ito kung bihira kang mag-online, o libreng Wi-Fi lang sa labas ng bahay ang nagagamit mo. Huwag piliin ito kung gumagana para sa iyo ang koneksyon mo halos araw-araw.',
  ],

  // ---- Step 6 ----
  'F8|pre_registration': [
    'Choose this if you want to register visitors and workers online before they arrive. Do not choose this if filling in a logbook at the gate is enough for you.',
    'Piliin ito kung gusto mong irehistro online ang mga bisita at manggagawa bago sila dumating. Huwag piliin ito kung sapat na sa iyo ang pagsusulat sa logbook sa gate.',
  ],
  'F8|closure': [
    'Choose this if you want to apply for a street or event closure online and see public closure notices. Do not choose this for general HOA announcements.',
    'Piliin ito kung gusto mong mag-apply online para sa pagsasara ng kalye o event at makita ang mga pampublikong abiso. Huwag piliin ito para sa pangkalahatang anunsyo ng HOA.',
  ],
  'F8|forms': [
    'Choose this if you want to register or authorize your tenant through an online form. Do not choose this if you do not have a tenant.',
    'Piliin ito kung gusto mong irehistro o pahintulutan ang iyong nangungupahan sa pamamagitan ng online na form. Huwag piliin ito kung wala kang nangungupahan.',
  ],
  'F8|registration': [
    'Choose this if you want to sign up for an account by showing a valid ID. Do not choose this if you want to use the website without an account.',
    'Piliin ito kung gusto mong mag-sign up ng account gamit ang balidong ID. Huwag piliin ito kung gusto mong gamitin ang website nang walang account.',
  ],
  'F8|requests': [
    'Choose this if you want to send a request and see whether it is received, being processed, or approved. Do not choose this if you only want to send a request with no updates.',
    'Piliin ito kung gusto mong magpadala ng request at makita kung natanggap, pinoproseso, o aprubado na. Huwag piliin ito kung request lang na walang update ang gusto mo.',
  ],
  'F8|accessible': [
    'Choose this if you want larger text, screen-reader support, or a simpler layout. Do not choose this if the regular version works for you.',
    'Piliin ito kung gusto mo ng mas malaking teksto, suporta sa screen reader, o mas simpleng layout. Huwag piliin ito kung sapat na sa iyo ang regular na bersyon.',
  ],

  'F9|no_reliable_internet': [
    'Choose this if your signal drops often or your data is very slow. Do not choose this for an occasional slowdown.',
    'Piliin ito kung madalas mawala ang signal mo o napakabagal ng data mo. Huwag piliin ito para sa paminsan-minsang bagal.',
  ],
  'F9|not_sure_how': [
    'Choose this if you would need help with apps, online forms, or uploading documents. Do not choose this if you know how but lack the time.',
    'Piliin ito kung kakailanganin mo ng tulong sa mga app, online na form, o pag-upload ng dokumento. Huwag piliin ito kung alam mo kung paano pero kulang ka sa oras.',
  ],
  'F9|data_worry': [
    'Choose this if you worry about your ID, address, or phone number being misused. Do not choose this if your worry is the cost of internet.',
    'Piliin ito kung nag-aalala kang magamit nang mali ang ID, address, o numero mo. Huwag piliin ito kung gastos sa internet ang inaalala mo.',
  ],
  'F9|prefer_office': [
    'Choose this if you prefer face-to-face service or doing things in person. Do not choose this if you cannot go online at all.',
    'Piliin ito kung mas gusto mo ang harapang serbisyo o personal na pag-aasikaso. Huwag piliin ito kung hindi ka talaga makapag-online.',
  ],
  'F9|no_device': [
    'Choose this if you have no phone or computer you can use, or yours is too old or broken. Do not choose this if you have a device you can use but find inconvenient.',
    'Piliin ito kung wala kang telepono o computer na magagamit, o sobrang luma o sira ang sa iyo. Huwag piliin ito kung may device kang magagamit pero hindi komportable.',
  ],

  // ---- Step 8 ----
  'P1|visitors': [
    'Choose this for relatives, friends, and guests visiting your home. Do not choose this for delivery riders or ride-hailing drivers, which have their own choices.',
    'Piliin ito para sa mga kamag-anak, kaibigan, at bisitang pumupunta sa bahay mo. Huwag piliin ito para sa delivery rider o driver ng ride-hailing, na may sarili nilang pagpipilian.',
  ],
  'P1|drivers': [
    'Choose this for a Grab or other ride-hailing driver, or a hired van or car for a special trip. Do not choose this for your own household driver.',
    'Piliin ito para sa driver ng Grab o ibang ride-hailing, o inarkilang van o kotse para sa special trip. Huwag piliin ito para sa sarili ninyong driver.',
  ],
  'P1|deliveries': [
    'Choose this for food, groceries, parcels, or courier packages brought to your door. Do not choose this for a visitor who happens to carry items.',
    'Piliin ito para sa pagkain, grocery, parcel, o courier na inihatid sa pintuan mo. Huwag piliin ito para sa bisitang may dalang gamit.',
  ],

  // ---- Step 9 ----
  'C1|requested': [
    'Choose this if you asked to close a street or area for a wake, fiesta, wedding, or block party. Do not choose this if you only attended an event.',
    'Piliin ito kung humiling kang isara ang kalye o lugar para sa lamay, fiesta, kasal, o handaan. Huwag piliin ito kung dumalo ka lang sa event.',
  ],
  'C1|affected': [
    'Choose this if you could not pass, park, or leave on time because of a closure someone else requested. Do not choose this for a closure you requested yourself.',
    'Piliin ito kung hindi ka nakadaan, nakapag-park, o nakaalis sa oras dahil sa pagsasarang hiniling ng iba. Huwag piliin ito para sa pagsasarang ikaw mismo ang humiling.',
  ],

  // ---- Step 11 ----
  'H1|clearance': [
    'Choose this for an HOA clearance for moving, selling, or applying for utilities. Do not choose this for a barangay clearance.',
    'Piliin ito para sa clearance ng HOA sa paglipat, pagbebenta, o pag-apply ng utilities. Huwag piliin ito para sa clearance ng barangay.',
  ],
  'H1|renovation_permit': [
    'Choose this for a permit for repairs, an extension, or major painting work. Do not choose this if you only asked about the rules.',
    'Piliin ito para sa permit sa pagkukumpuni, extension, o malaking pagpipintura. Huwag piliin ito kung nagtanong ka lang tungkol sa patakaran.',
  ],
  'H1|vehicle_sticker': [
    'Choose this for a new or renewed vehicle sticker. Do not choose this for a visitor parking pass.',
    'Piliin ito para sa bago o na-renew na sticker ng sasakyan. Huwag piliin ito para sa pass sa parking ng bisita.',
  ],
  'H1|tenant_registration': [
    'Choose this if you registered a tenant or gave an authorization letter for one. Do not choose this for signing the lease itself.',
    'Piliin ito kung nagrehistro ka ng nangungupahan o nagbigay ng authorization letter para sa kanila. Huwag piliin ito para sa mismong pagpirma ng lease.',
  ],

  'T1|tenant_registration': [
    'Choose this if you submitted your details and ID to the HOA as a tenant. Do not choose this for signing the lease with the owner.',
    'Piliin ito kung nagsumite ka ng detalye at ID sa HOA bilang nangungupahan. Huwag piliin ito para sa pagpirma ng lease sa may-ari.',
  ],
  'T1|move_in_clearance': [
    'Choose this if you needed HOA approval to bring your belongings in. Do not choose this if you moved in without needing approval.',
    'Piliin ito kung kinailangan mo ng pag-apruba ng HOA para maipasok ang mga gamit mo. Huwag piliin ito kung lumipat ka nang hindi kailangan ng pag-apruba.',
  ],
  'T1|visitor_worker_passes': [
    'Choose this for gate passes for guests, helpers, or workers. Do not choose this for your own household members.',
    'Piliin ito para sa gate pass ng bisita, katulong, o manggagawa. Huwag piliin ito para sa sarili mong kasambahay.',
  ],
  'T1|vehicle_sticker': [
    'Choose this for a new or renewed vehicle sticker. Do not choose this for a visitor parking pass.',
    'Piliin ito para sa bago o na-renew na sticker ng sasakyan. Huwag piliin ito para sa pass sa parking ng bisita.',
  ],
  'T1|owner_docs_needed': [
    "Choose this if a form needed the owner's signed letter, ID copy, or title. Do not choose this if you only had to provide your own documents.",
    'Piliin ito kung may form na nangailangan ng pirmadong liham, kopya ng ID, o titulo ng may-ari. Huwag piliin ito kung sarili mo lang na dokumento ang kinailangan mong ibigay.',
  ],

  // ---- Step 12 ----
  'AC4|the_person_themselves': [
    'Choose this if the person with the difficulty would use the website directly. Do not choose this if someone else would use it for them.',
    'Piliin ito kung ang taong may hirap ang direktang gagamit ng website. Huwag piliin ito kung iba ang gagamit para sa kanya.',
  ],
  'AC4|family_member': [
    'Choose this if a spouse, child, or sibling would help. Do not choose this for a paid helper or nurse.',
    'Piliin ito kung asawa, anak, o kapatid ang tutulong. Huwag piliin ito para sa bayad na katulong o nars.',
  ],
  'AC4|caregiver_or_rep': [
    'Choose this if a caregiver, nurse, or someone authorized in writing would help. Do not choose this for a family member.',
    'Piliin ito kung tagapag-alaga, nars, o sinumang pinahintulutan nang nakasulat ang tutulong. Huwag piliin ito para sa kapamilya.',
  ],

  // ---- Step 13 ----
  'IV1|yes': [
    'Choose this if you are fine being contacted later, when you can still say no. Do not choose this if you want to agree to a fixed date now.',
    'Piliin ito kung ayos lang sa iyo na makontak sa ibang pagkakataon, kung kailan puwede ka pa ring tumanggi. Huwag piliin ito kung gusto mong pumayag sa takdang petsa ngayon.',
  ],
};

const A3_GUIDANCE: Guidance = [
  'Include everyone who lives there, such as children, older adults, and live-in helpers. Leave out guests who stay only a few days.',
  'Isama ang lahat ng nakatira roon, tulad ng mga bata, nakatatanda, at kasambahay na kasama sa bahay. Huwag isama ang mga bisitang ilang araw lang tumutuloy.',
];
for (const id of ['1', '2', '3', '4', '5', '6+']) GUIDANCE[`A3|${id}`] = A3_GUIDANCE;

const B5_GUIDANCE: Guidance = [
  'Include submitting online forms, booking a ride, and online shopping. Leave out browsing social media or messaging.',
  'Isama ang pagsusumite ng online form, pag-book ng sasakyan, at online shopping. Huwag isama ang pagba-browse sa social media o pagmemensahe.',
];
for (const id of ['weekly_or_more', 'few_times_a_month', 'few_times_a_year']) GUIDANCE[`B5|${id}`] = B5_GUIDANCE;

const B6_GUIDANCE: Guidance = [
  'Include mobile load, data promos, and a home Wi-Fi bill. Leave out the cost of buying a phone or device.',
  'Isama ang mobile load, data promo, at bill sa home Wi-Fi. Huwag isama ang presyo ng pagbili ng telepono o device.',
];
for (const id of ['under_100', '100_299', '300_499', '500_999', '1000_1999', '2000_plus']) GUIDANCE[`B6|${id}`] = B6_GUIDANCE;

export const OPTION_NOTES: Record<string, Record<string, string>> = {};
export const OPTION_NOTES_FIL: Record<string, string> = {};
for (const [code, id, baseEn, baseFil] of ROWS) {
  const guidance = GUIDANCE[`${code}|${id}`];
  const en = guidance ? `${baseEn} ${guidance[0]}` : baseEn;
  const fil = guidance ? `${baseFil} ${guidance[1]}` : baseFil;
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
