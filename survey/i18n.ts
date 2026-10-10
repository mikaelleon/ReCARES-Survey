/**
 * Filipino (Tagalog) display copy for the resident survey.
 * Stored answers and option ids always stay English; only what the resident
 * reads is translated. Unknown strings fall back to the English original.
 */

export type SurveyLang = 'EN' | 'FIL';

const FIL: Record<string, string> = {
  // ---- Chrome ----
  'Leave the survey': 'Umalis sa survey',
  Review: 'Suriin',
  Back: 'Bumalik',
  Continue: 'Magpatuloy',
  Submit: 'Isumite',
  Edit: 'Baguhin',
  Yes: 'Oo',
  No: 'Hindi',
  Other: 'Iba pa',
  'Other problem': 'Iba pang problema',
  'Select…': 'Pumili…',
  required: 'kinakailangan',
  'Back to home': 'Bumalik sa home',
  'Resume where you stopped': 'Ituloy kung saan ka huminto',
  'Start the survey': 'Simulan ang survey',
  'Company': 'Kumpanya',
  'Resident Needs Assessment Survey': 'Survey sa Pangangailangan ng mga Residente',
  'Consent and eligibility': 'Pahintulot at pagiging karapat-dapat',
  'Thank you': 'Salamat',
  'Review and submit': 'Suriin at isumite',
  Homeowner: 'May-ari ng bahay',
  'Tenant and lessee': 'Nangungupahan',
  'Language': 'Wika',

  // ---- Welcome / consent ----
  'A response was already sent from this device. Continue only if you are a different person. This reminder cannot block a second response.':
    'May naipadala nang sagot mula sa device na ito. Magpatuloy lamang kung ibang tao ka. Hindi hinaharang ng paalalang ito ang pangalawang sagot.',
  'This survey is part of a capstone study by BSIT students of the University of Batangas, Lipa Campus. The study looks at how online services could make everyday transactions easier for residents of Camella Homes Tibig, including residents who find it hard to visit the HOA office. The study team is exploring a possible collaboration with the Homeowners Association. This is a student survey and is not an official HOA survey.':
    'Ang survey na ito ay bahagi ng capstone study ng mga mag-aaral ng BSIT ng University of Batangas, Lipa Campus. Tinitingnan ng pag-aaral kung paano mapapadali ng mga online na serbisyo ang pang-araw-araw na transaksyon ng mga residente ng Camella Homes Tibig, kasama ang mga residenteng nahihirapang pumunta sa opisina ng HOA. Sinusuri ng grupo ang posibleng pakikipagtulungan sa Homeowners Association. Ito ay survey ng mga mag-aaral at hindi opisyal na survey ng HOA.',
  'The survey takes about 11 to 13 minutes. Your answers are anonymous.':
    'Tumatagal ang survey nang humigit-kumulang 11 hanggang 13 minuto. Anonymous ang iyong mga sagot.',
  'Questions about the study? Use the': 'May tanong tungkol sa pag-aaral? Gamitin ang',
  'inquiry form': 'inquiry form',
  'Your answers in this survey are anonymous. We do not ask for your name, and your responses will be reported only as numbers and group totals, such as percentages and averages, and not by name. No answer will be linked to you, your household, or your unit. Written answers, if you choose to give any, will be summarized without names or identifying details.':
    'Anonymous ang iyong mga sagot sa survey na ito. Hindi namin hinihingi ang iyong pangalan, at iuulat lamang ang mga sagot bilang mga numero at kabuuan ng grupo, tulad ng porsyento at average, hindi ayon sa pangalan. Walang sagot na maiuugnay sa iyo, sa iyong sambahayan, o sa iyong unit. Ang mga nakasulat na sagot, kung magbibigay ka, ay bubuurin nang walang pangalan o anumang makakakilanlan.',
  'Some questions ask about your age, sex, civil status, and disability. You may choose "Prefer not to say" for any of them. Taking part is voluntary. You may skip any question you are not comfortable with or stop at any time. Your answers will be used only for this study and handled in line with the Data Privacy Act of 2012 (Republic Act 10173).':
    'May ilang tanong tungkol sa iyong edad, kasarian, civil status, at kapansanan. Maaari mong piliin ang "Mas gusto kong hindi sabihin" sa alinman sa mga ito. Kusang-loob ang pakikilahok. Maaari mong laktawan ang anumang tanong na hindi ka komportableng sagutin o huminto anumang oras. Gagamitin lamang ang iyong mga sagot sa pag-aaral na ito at hahawakan alinsunod sa Data Privacy Act of 2012 (Republic Act 10173).',
  'I have read the information above and I agree to take part in this survey.':
    'Nabasa ko ang impormasyon sa itaas at sumasang-ayon akong lumahok sa survey na ito.',
  'I agree': 'Sumasang-ayon ako',
  'I do not agree': 'Hindi ako sumasang-ayon',
  'I am 18 years old or older, and I own, rent, or live in a home in Camella Homes Tibig.':
    'Ako ay 18 taong gulang pataas, at nagmamay-ari, umuupa, o nakatira sa isang bahay sa Camella Homes Tibig.',
  'Thank you for your time. You chose not to take part, so no answers were recorded.':
    'Salamat sa iyong oras. Pinili mong hindi lumahok, kaya walang naitalang sagot.',
  'Thank you. This survey is only for adult owners, tenants, and household members of Camella Homes Tibig.':
    'Salamat. Ang survey na ito ay para lamang sa mga nasa hustong gulang na may-ari, nangungupahan, at miyembro ng sambahayan sa Camella Homes Tibig.',
  'Please review your answers and try again.': 'Pakisuri ang iyong mga sagot at subukang muli.',
  'Please take a moment to review your answers before submitting.':
    'Maglaan ng sandali upang suriin ang iyong mga sagot bago isumite.',
  'The response could not be saved. Please try again.':
    'Hindi nai-save ang sagot. Pakisubukang muli.',
  'The summary below shows what you answered. If you’re using a shared or public device, make sure no one else can see this screen before you submit.':
    'Ipinapakita sa buod sa ibaba ang iyong mga sagot. Kung gumagamit ka ng pinagsasaluhan o pampublikong device, tiyaking walang ibang makakakita ng screen na ito bago ka magsumite.',
  "The summary below shows what you answered. If you're using a shared or public device, make sure no one else can see this screen before you submit.":
    'Ipinapakita sa buod sa ibaba ang iyong mga sagot. Kung gumagamit ka ng pinagsasaluhan o pampublikong device, tiyaking walang ibang makakakita ng screen na ito bago ka magsumite.',

  // ---- Validation ----
  'Please choose one answer to continue.': 'Pumili ng isang sagot upang magpatuloy.',
  'Please select at least one answer to continue.': 'Pumili ng kahit isang sagot upang magpatuloy.',
  'Please use 200 characters or fewer.': 'Gumamit ng 200 karakter o mas kaunti.',

  // ---- Common notes ----
  'A red asterisk (*) means you need to answer that question before you can continue.':
    'Ang pulang asterisk (*) ay nangangahulugang kailangan mong sagutin ang tanong bago ka makapagpatuloy.',
  'Answer for your unit, including what your representative or caretaker experiences.':
    'Sagutin para sa iyong unit, kasama ang nararanasan ng iyong kinatawan o tagapag-alaga.',
  "If you do not handle HOA transactions yourself, answer the later questions using what you know about your household's experience, or choose Not applicable.":
    'Kung hindi ikaw mismo ang nag-aasikaso ng mga transaksyon sa HOA, sagutin ang mga susunod na tanong batay sa alam mo sa karanasan ng iyong sambahayan, o piliin ang Hindi naaangkop.',
  'You can finish this survey with help. Someone you trust can read the questions and enter the answers you choose.':
    'Maaari mong tapusin ang survey na ito nang may tulong. Maaaring basahin ng taong pinagkakatiwalaan mo ang mga tanong at ilagay ang mga sagot na pipiliin mo.',

  // ---- Step 1 ----
  'Your answers in this pre-screening form decides which sets of questions would be shown to you.':
    'Ang mga sagot mo sa pre-screening na ito ang magpapasya kung aling mga hanay ng tanong ang ipapakita sa iyo.',
  "You may choose 'Prefer not to say' for personal questions.":
    "Maaari mong piliin ang 'Mas gusto kong hindi sabihin' sa mga personal na tanong.",
  'Which best describes you?': 'Alin ang pinakaangkop na naglalarawan sa iyo?',
  'Homeowner living in the unit': 'May-ari ng bahay na nakatira sa unit',
  'Homeowner who does not live in the unit': 'May-ari ng bahay na hindi nakatira sa unit',
  'OFW homeowner': 'May-ari ng bahay na OFW',
  '(the owner works abroad)': '(ang may-ari ay nagtatrabaho sa ibang bansa)',
  'Absentee homeowner': 'May-ari ng bahay na nakatira sa ibang lugar',
  '(the owner lives elsewhere in the Philippines)': '(ang may-ari ay nakatira sa ibang lugar sa Pilipinas)',
  'Family or household member of a homeowner': 'Kapamilya o miyembro ng sambahayan ng may-ari ng bahay',
  'Tenant or lessee': 'Nangungupahan',
  'Family or household member of a tenant or lessee': 'Kapamilya o miyembro ng sambahayan ng nangungupahan',
  'How many people live in the unit?': 'Ilang tao ang nakatira sa unit?',
  '6 or more': '6 o higit pa',
  'No one lives in the unit right now': 'Walang nakatira sa unit sa ngayon',
  'Which phase do you live in?': 'Saang phase ka nakatira?',
  'Phase 1': 'Phase 1',
  'Phase 2': 'Phase 2',
  'Phase 3': 'Phase 3',
  'Phase 4 Heights': 'Phase 4 Heights',
  'Phase 5 Highlands': 'Phase 5 Highlands',
  'Phase 6 Eastgrove': 'Phase 6 Eastgrove',
  'Do you or another member of your household have a disability or mobility limitation?':
    'Ikaw ba o ang isa pang miyembro ng iyong sambahayan ay may kapansanan o limitasyon sa paggalaw?',
  'Prefer not to say': 'Mas gusto kong hindi sabihin',
  'In the past 12 months, did you have construction, renovation, or repair work done that needed outside workers to enter the subdivision?':
    'Sa nakalipas na 12 buwan, nagpagawa ka ba ng konstruksyon, renovation, o pagkukumpuni na nangailangan ng mga manggagawa mula sa labas na pumasok sa subdivision?',
  'What kind of difficulty applies to you or the household member? Select all that apply.':
    'Anong uri ng hirap ang naaangkop sa iyo o sa miyembro ng sambahayan? Piliin ang lahat ng naaangkop.',
  'Difficulty walking or climbing stairs': 'Nahihirapang maglakad o umakyat ng hagdan',
  'Uses a wheelchair or mobility aid': 'Gumagamit ng wheelchair o gamit pantulong sa paggalaw',
  'Difficulty seeing': 'Nahihirapang makakita',
  'Difficulty hearing': 'Nahihirapang makarinig',
  'Difficulty reading or understanding forms': 'Nahihirapang magbasa o umunawa ng mga porma',

  // ---- Step 2 ----
  'What is your age range?': 'Anong saklaw ng iyong edad?',
  '18 to 24': '18 hanggang 24',
  '25 to 34': '25 hanggang 34',
  '35 to 44': '35 hanggang 44',
  '45 to 54': '45 hanggang 54',
  '55 to 64': '55 hanggang 64',
  '65 and above': '65 pataas',
  Sex: 'Kasarian',
  Female: 'Babae',
  Male: 'Lalaki',
  'Civil status': 'Civil status',
  Single: 'Single',
  Married: 'Kasal',
  'Living with a partner': 'Kasama ang kinakasama',
  Widowed: 'Balo',
  Separated: 'Hiwalay',
  'Who usually handles HOA transactions for your household?':
    'Sino ang karaniwang nag-aasikaso ng mga transaksyon sa HOA para sa iyong sambahayan?',
  'I do': 'Ako',
  'Another member of my household': 'Isa pang miyembro ng aking sambahayan',
  'A caregiver, helper, or representative': 'Isang tagapag-alaga, katulong, o kinatawan',
  'The property owner or landlord': 'Ang may-ari ng ari-arian o landlord',
  'It varies': 'Nagbabago-bago',
  'Which channel do you mainly use for HOA transactions?':
    'Anong paraan ang pangunahin mong ginagamit sa mga transaksyon sa HOA?',
  'Walk in at the HOA office': 'Personal na pumunta sa opisina ng HOA',
  'Phone call': 'Tawag sa telepono',
  'Facebook page or message': 'Facebook page o mensahe',
  'Email or website': 'Email o website',
  'Through a neighbor or HOA officer': 'Sa pamamagitan ng kapitbahay o opisyal ng HOA',
  'I have not done any HOA transaction': 'Wala pa akong ginawang transaksyon sa HOA',

  // ---- Step 3 / 4 ----
  'These questions help us understand what kind of online service would work for residents.':
    'Tinutulungan kami ng mga tanong na ito na maunawaan kung anong uri ng online na serbisyo ang babagay sa mga residente.',
  'Which devices do you use regularly? Select all that apply.':
    'Anong mga device ang regular mong ginagamit? Piliin ang lahat ng naaangkop.',
  Smartphone: 'Smartphone',
  'Laptop or desktop computer': 'Laptop o desktop computer',
  Tablet: 'Tablet',
  'A shared household device': 'Device na pinagsasaluhan ng sambahayan',
  'None of these': 'Wala sa mga ito',
  'What kind of phone do you mainly use?': 'Anong klase ng telepono ang pangunahin mong ginagamit?',
  Android: 'Android',
  'iPhone (iOS)': 'iPhone (iOS)',
  'I do not use a smartphone': 'Hindi ako gumagamit ng smartphone',
  'How do you mainly get online?': 'Paano ka pangunahing nakakapag-online?',
  'Wi-Fi or broadband subscription': 'Subscription sa Wi-Fi o broadband',
  'Prepaid mobile data (load or promo)': 'Prepaid na mobile data (load o promo)',
  'Postpaid mobile data': 'Postpaid na mobile data',
  'Both Wi-Fi and mobile data': 'Parehong Wi-Fi at mobile data',
  'I do not have regular internet access': 'Wala akong regular na internet',
  'How often do you go online?': 'Gaano ka kadalas nag-o-online?',
  'Several times a day': 'Ilang beses sa isang araw',
  'About once a day': 'Mga isang beses sa isang araw',
  'A few times a week': 'Ilang beses sa isang linggo',
  'About once a week or less': 'Mga isang beses sa isang linggo o mas madalang',
  'Rarely or never': 'Bihira o hindi kailanman',
  'How often do you do transactions online, such as paying bills, submitting forms, or ordering?':
    'Gaano ka kadalas gumagawa ng transaksyon online, tulad ng pagbabayad ng bills, pagsusumite ng porma, o pag-oorder?',
  'Weekly or more': 'Lingguhan o mas madalas',
  'A few times a month': 'Ilang beses sa isang buwan',
  'A few times a year': 'Ilang beses sa isang taon',
  Never: 'Hindi kailanman',
  'About how much do you spend on mobile data or internet each month, in pesos?':
    'Magkano ang halos ginagastos mo sa mobile data o internet kada buwan, sa piso?',
  None: 'Wala',
  'Under 100': 'Wala pang 100',
  '100 to 299': '100 hanggang 299',
  '300 to 499': '300 hanggang 499',
  '500 to 999': '500 hanggang 999',
  '1,000 to 1,999': '1,000 hanggang 1,999',
  '2,000 or more': '2,000 o higit pa',
  'Not sure': 'Hindi sigurado',
  'My internet connection is stable enough to finish an online form without interruption.':
    'Sapat na matatag ang aking internet para matapos ang isang online na porma nang walang abala.',
  'I avoid installing new apps because of limited phone storage or mobile data.':
    'Iniiwasan kong mag-install ng bagong app dahil sa limitadong storage ng telepono o mobile data.',
  'I am comfortable opening a website on my phone browser instead of installing an app.':
    'Komportable akong magbukas ng website sa browser ng aking telepono sa halip na mag-install ng app.',

  // ---- Step 5 / 6 ----
  'Imagine a website that Camella Homes Tibig residents could open on a phone or computer to do some HOA transactions from home. The following questions describe some things this website could do. Please tell us how likely you would be to use each one. There are no right or wrong answers.':
    'Isipin ang isang website na mabubuksan ng mga residente ng Camella Homes Tibig sa telepono o computer upang gawin ang ilang transaksyon sa HOA mula sa bahay. Inilalarawan ng mga sumusunod na tanong ang ilang magagawa ng website na ito. Sabihin kung gaano mo malamang gamitin ang bawat isa. Walang tama o maling sagot.',
  'How likely are you to use online pre-registration for visitors and workers, with a temporary pass?':
    'Gaano mo kalamang gamitin ang online na pre-registration para sa mga bisita at manggagawa, na may pansamantalang pass?',
  'How likely are you to use an online request for street or event closure permits, with notices sent to residents of the affected phase?':
    'Gaano mo kalamang gamitin ang online na kahilingan para sa permit sa pagsasara ng kalsada o event, na may abisong ipapadala sa mga residente ng apektadong phase?',
  'How likely are you to use online registration where you upload a photo of a valid ID and the HOA Board verifies it?':
    'Gaano mo kalamang gamitin ang online na rehistrasyon kung saan mag-a-upload ka ng larawan ng valid ID at ive-verify ito ng HOA Board?',
  'How likely are you to use an online channel to send requests or concerns to the HOA and track their status?':
    'Gaano mo kalamang gamitin ang isang online na paraan upang magpadala ng kahilingan o hinaing sa HOA at subaybayan ang katayuan nito?',
  'How likely are you to use a version of the website with adjustable text size, higher contrast, and screen reader support?':
    'Gaano mo kalamang gamitin ang bersyon ng website na may naaayos na laki ng teksto, mas mataas na contrast, at suporta sa screen reader?',
  'A website with these features would solve some of the problems I face as a resident.':
    'Malulutas ng website na may ganitong mga tampok ang ilan sa mga problemang kinakaharap ko bilang residente.',
  'Which of these would you want available first? Select up to 3.':
    'Alin sa mga ito ang gusto mong mauna? Pumili ng hanggang 3.',
  'Pre-registration of visitors and workers': 'Pre-registration ng mga bisita at manggagawa',
  'Online closure permits and notices': 'Online na permit at abiso sa pagsasara',
  'Online forms for owners and tenants': 'Online na porma para sa mga may-ari at nangungupahan',
  'Online registration with ID verification': 'Online na rehistrasyon na may beripikasyon ng ID',
  'Online requests with status tracking': 'Online na kahilingan na may pagsubaybay sa katayuan',
  'Accessible version of the website': 'Accessible na bersyon ng website',
  'What might keep you from using this website? Select all that apply.':
    'Ano ang maaaring pumigil sa iyo na gamitin ang website na ito? Piliin ang lahat ng naaangkop.',
  'No reliable internet': 'Walang maaasahang internet',
  'Not sure how to use it': 'Hindi sigurado kung paano ito gamitin',
  'Worried about my personal data': 'Nag-aalala sa aking personal na datos',
  'Prefer going to the office': 'Mas gusto kong pumunta sa opisina',
  'Do not have a suitable device': 'Walang angkop na device',
  'Nothing would stop me': 'Walang makakapigil sa akin',
  'Is there another feature or service you would want from this kind of website?':
    'May iba ka pa bang tampok o serbisyong gusto mula sa ganitong uri ng website?',

  // ---- Step 7 / 8 / 9 ----
  'These questions are about how you reach the HOA today.':
    'Ang mga tanong na ito ay tungkol sa kung paano mo nakokontak ang HOA sa kasalukuyan.',
  'The HOA office hours make it hard for me to do my transactions.':
    'Nahihirapan akong gawin ang aking mga transaksyon dahil sa oras ng opisina ng HOA.',
  'I have to visit the HOA office in person even for simple matters.':
    'Kailangan kong personal na pumunta sa opisina ng HOA kahit sa mga simpleng bagay.',
  'I receive a response to my concerns within a reasonable time.':
    'Nakakatanggap ako ng tugon sa aking mga hinaing sa makatwirang oras.',
  'In the past 3 months, who did you or your household need to bring through the gate? Select all that apply.':
    'Sa nakalipas na 3 buwan, sino ang kinailangan ninyong papasukin sa gate? Piliin ang lahat ng naaangkop.',
  Visitors: 'Mga bisita',
  'Ride-hailing or special-trip drivers': 'Mga driver ng ride-hailing o special trip',
  Deliveries: 'Mga delivery',
  'Waiting at the gate to get a permit or pass takes too long for my visitors, workers, or drivers.':
    'Masyadong matagal ang paghihintay sa gate para sa permit o pass ng aking mga bisita, manggagawa, o driver.',
  'Leaving an ID at the gate is inconvenient for my household or guests.':
    'Abala sa aking sambahayan o mga bisita ang pag-iwan ng ID sa gate.',
  'About how many minutes does a typical wait at the gate take?':
    'Mga ilang minuto karaniwang tumatagal ang paghihintay sa gate?',
  'Getting my construction or repair workers approved to enter takes too many steps.':
    'Masyadong maraming hakbang ang pagpapa-aprubang makapasok ang aking mga manggagawa sa konstruksyon o pagkukumpuni.',
  'In the past 12 months, which describes you?': 'Sa nakalipas na 12 buwan, alin ang naglalarawan sa iyo?',
  'I requested a street or event closure': 'Humiling ako ng pagsasara ng kalsada o event',
  'My household was affected by a closure someone else requested':
    'Naapektuhan ang aking sambahayan ng pagsasarang hiniling ng iba',
  Both: 'Pareho',
  Neither: 'Wala sa dalawa',
  'The process of getting a street or event closure permit is clear.':
    'Malinaw ang proseso ng pagkuha ng permit sa pagsasara ng kalsada o event.',
  'Notices about street closures and rerouting reach me in time.':
    'Nakararating sa akin sa tamang oras ang mga abiso tungkol sa pagsasara ng kalsada at pagbabago ng ruta.',

  // ---- Step 10 / 11 / 12 ----
  'Some online services need you to register and show a valid ID. These questions are about how you feel about that.':
    'May mga online na serbisyong nangangailangang magparehistro at magpakita ng valid ID. Ang mga tanong na ito ay tungkol sa nararamdaman mo rito.',
  'I am comfortable uploading a photo of my valid ID to a secure online form.':
    'Komportable akong mag-upload ng larawan ng aking valid ID sa isang ligtas na online na porma.',
  'I trust that only authorized HOA personnel would be able to see my ID.':
    'Pinagkakatiwalaan kong awtorisadong tauhan lamang ng HOA ang makakakita ng aking ID.',
  'After my ID has been verified, how long should it be kept?':
    'Matapos ma-verify ang aking ID, gaano katagal ito dapat itago?',
  'Deleted right after verification': 'Burahin kaagad pagkatapos ng beripikasyon',
  'Kept for as long as I live in the subdivision': 'Itago habang nakatira ako sa subdivision',
  'No preference': 'Walang kagustuhan',
  'Which HOA transactions did your household do in the past 12 months? Select all that apply.':
    'Anong mga transaksyon sa HOA ang ginawa ng inyong sambahayan sa nakalipas na 12 buwan? Piliin ang lahat ng naaangkop.',
  Clearance: 'Clearance',
  'Renovation permit': 'Permit sa renovation',
  'Vehicle sticker': 'Sticker ng sasakyan',
  'Billing or dues': 'Billing o bayarin',
  'Tenant registration or authorization': 'Rehistrasyon o awtorisasyon ng nangungupahan',
  'Completing HOA clearances, forms, and permits needs more office visits than it should.':
    'Mas maraming beses kailangang pumunta sa opisina kaysa dapat para makumpleto ang mga clearance, porma, at permit ng HOA.',
  'Registering or authorizing a tenant with the HOA is easy.':
    'Madali ang pagrerehistro o pag-awtorisa ng nangungupahan sa HOA.',
  'Describe one HOA transaction that took the longest, and why.':
    'Ilarawan ang isang transaksyon sa HOA na pinakamatagal, at kung bakit.',
  'Your answers will not be shared with your landlord or the Homeowners Association.':
    'Hindi ibabahagi ang iyong mga sagot sa iyong landlord o sa Homeowners Association.',
  'Which HOA requirements did your household deal with as tenants in the past 12 months? Select all that apply.':
    'Anong mga requirement ng HOA ang hinarap ng inyong sambahayan bilang nangungupahan sa nakalipas na 12 buwan? Piliin ang lahat ng naaangkop.',
  'Tenant registration': 'Rehistrasyon ng nangungupahan',
  'Move-in clearance': 'Clearance sa paglipat',
  'Visitor or worker passes': 'Pass ng bisita o manggagawa',
  "Forms needing the owner's signature or documents": 'Mga porma na nangangailangan ng pirma o dokumento ng may-ari',
  "The HOA's forms and requirements for tenants are clear.":
    'Malinaw ang mga porma at requirement ng HOA para sa mga nangungupahan.',
  "Completing HOA requirements as a tenant takes more steps than it should, such as needing the owner's documents or signature.":
    'Mas maraming hakbang kaysa dapat ang pagkumpleto ng mga requirement ng HOA bilang nangungupahan, tulad ng pangangailangan ng dokumento o pirma ng may-ari.',
  'Which HOA requirement was hardest for your household as a tenant?':
    'Anong requirement ng HOA ang pinakamahirap para sa inyong sambahayan bilang nangungupahan?',
  'Please go back and choose which best describes you.':
    'Bumalik at piliin kung alin ang pinakaangkop na naglalarawan sa iyo.',
  'These questions are voluntary. You may choose Prefer not to say for any of them.':
    'Kusang-loob ang pagsagot sa mga tanong na ito. Maaari mong piliin ang Mas gusto kong hindi sabihin sa alinman.',
  'Going to the HOA office in person is difficult for me or for someone in my household.':
    'Mahirap para sa akin o sa isang miyembro ng aking sambahayan ang personal na pagpunta sa opisina ng HOA.',
  'Larger text, higher contrast, or screen reader support would help me or someone in my household use an online form.':
    'Makakatulong sa akin o sa isang miyembro ng aking sambahayan ang mas malaking teksto, mas mataas na contrast, o suporta sa screen reader sa paggamit ng online na porma.',
  'If an online service were available, who would use it for the household member who needs help?':
    'Kung may online na serbisyo, sino ang gagamit nito para sa miyembro ng sambahayan na nangangailangan ng tulong?',
  'The person themselves': 'Ang mismong tao',
  'A family member': 'Isang kapamilya',
  'A caregiver or authorized representative': 'Isang tagapag-alaga o awtorisadong kinatawan',
  'Not applicable': 'Hindi naaangkop',

  // ---- Step 13 ----
  'This last part helps us find problems we may have missed.':
    'Ang huling bahaging ito ay tumutulong sa amin na makita ang mga problemang maaaring hindi namin natanong.',
  'Besides what was asked, which of these HOA-related problems have you experienced? Select all that apply.':
    'Bukod sa mga naitanong, alin sa mga problemang may kinalaman sa HOA ang naranasan mo? Piliin ang lahat ng naaangkop.',
  'Is there any other problem with HOA services that you would like us to know about?':
    'May iba pa bang problema sa mga serbisyo ng HOA na nais mong malaman namin?',
  'Please do not write names.': 'Huwag magsulat ng mga pangalan.',
  'Would you be open to being contacted for a possible follow-up interview?':
    'Bukas ka ba na makontak para sa posibleng follow-up na panayam?',

  // ---- O1 categories and items ----
  'Water supply or interruptions': 'Suplay ng tubig o pagkaputol nito',
  'Frequent water interruptions or no water supply': 'Madalas na pagkaputol ng tubig o walang suplay ng tubig',
  'Water interruptions happen without advance notice': 'Nawawalan ng tubig nang walang paunang abiso',
  'Scheduled interruptions are announced too late': 'Huli na ang abiso sa mga nakatakdang putulan ng tubig',
  'Water stays out for many hours or days': 'Ilang oras o araw na walang tubig',
  'Low water pressure': 'Mahina ang pressure ng tubig',
  'Dirty, discolored, or foul-smelling water': 'Marumi, iba ang kulay, o mabahong tubig',
  'Leaking or broken water pipes are not repaired quickly': 'Hindi agad naaayos ang tumutulo o sirang tubo',
  'No alternative water source during outages (tanker or refill)':
    'Walang alternatibong mapagkukunan ng tubig tuwing putol (tanker o refill)',
  'Unclear who to contact or how to report a water problem':
    'Hindi malinaw kung sino ang kokontakin o paano iuulat ang problema sa tubig',
  'No updates on when the water will return': 'Walang update kung kailan babalik ang tubig',
  'Unfair or unclear water charges': 'Hindi patas o hindi malinaw na singil sa tubig',
  'Power interruptions or electrical hazards': 'Pagkaputol ng kuryente o panganib sa kuryente',
  'Frequent power interruptions': 'Madalas na pagkaputol ng kuryente',
  'Power outages with no announcement': 'Brownout nang walang abiso',
  'Hanging, exposed, or unsafe electrical wires': 'Nakalawit, nakalantad, o delikadong kable ng kuryente',
  'Slow follow-up on reported power problems': 'Mabagal na aksyon sa mga naiulat na problema sa kuryente',
  'Garbage collection': 'Pangongolekta ng basura',
  'Missed collection days': 'Hindi nakolektang araw',
  'Collection schedule is unclear': 'Hindi malinaw ang iskedyul ng kolekta',
  'Garbage left uncollected for days': 'Ilang araw na hindi nakokolektang basura',
  'Improper waste segregation not enforced': 'Hindi ipinatutupad ang tamang paghihiwalay ng basura',
  'Foul odor or pests from garbage areas': 'Mabahong amoy o peste mula sa lugar ng basura',
  'Street lights': 'Ilaw sa kalsada',
  'Lights not working': 'Hindi gumagana ang mga ilaw',
  'Areas that are too dark at night': 'Mga lugar na masyadong madilim sa gabi',
  'Repairs take too long': 'Matagal ang pagkukumpuni',
  'Roads or drainage': 'Kalsada o drainage',
  'Potholes or damaged roads': 'Lubak o sirang kalsada',
  'Flooding or poor drainage': 'Pagbaha o mahinang drainage',
  'Blocked or clogged drains': 'Barado ang mga kanal',
  'Noise or curfew concerns': 'Ingay o curfew',
  'Loud parties or gatherings': 'Maingay na handaan o pagtitipon',
  'Construction noise outside allowed hours': 'Ingay ng konstruksyon sa labas ng pinapayagang oras',
  'Curfew hours are unclear or unenforced': 'Hindi malinaw o hindi ipinatutupad ang curfew',
  Parking: 'Paradahan',
  'Not enough visitor parking': 'Kulang ang paradahan ng bisita',
  'Vehicles blocking driveways or roads': 'Mga sasakyang humaharang sa driveway o kalsada',
  'Parking rules are unclear': 'Hindi malinaw ang patakaran sa paradahan',
  'Security patrol': 'Pagroronda ng seguridad',
  'Guards not visible or not patrolling regularly': 'Hindi nakikita o hindi regular na nagroronda ang mga guwardiya',
  'Slow response to concerns': 'Mabagal na tugon sa mga hinaing',
  'Procedures are unclear': 'Hindi malinaw ang mga pamamaraan',
  'Long queues or delays at the gate': 'Mahahabang pila o pagkaantala sa gate',
  'Unclear billing or charges': 'Hindi malinaw na billing o singil',
  'Difficulty getting a receipt or statement': 'Hirap makakuha ng resibo o statement',
  'Disputes not resolved': 'Hindi nareresolba ang mga alitan',
  'Renovation permits': 'Permit sa renovation',
  'Requirements are unclear': 'Hindi malinaw ang mga requirement',
  'Approval takes too long': 'Matagal ang pag-apruba',
  'Difficulty reaching the engineer or office in charge': 'Hirap makontak ang engineer o opisinang may hawak',
  'Pet or animal concerns': 'Alalahanin sa alagang hayop',
  'Stray animals': 'Mga gala-galang hayop',
  'Pets not kept leashed or contained': 'Mga alagang hindi nakatali o nakakulong',
  'Noise from animals': 'Ingay mula sa mga hayop',
  'Common areas or facilities': 'Mga common area o pasilidad',
  'Clubhouse, court, or playground not well maintained': 'Hindi maayos na napapanatili ang clubhouse, court, o palaruan',
  'Gate or perimeter fence damaged': 'Sirang gate o bakod sa paligid',
  'Overgrown grass or untrimmed trees in common areas': 'Mahabang damo o hindi pinuputol na puno sa mga common area',
  'Facility reservation is difficult or unclear': 'Mahirap o hindi malinaw ang pagpapareserba ng pasilidad',
  'Disputes between neighbors': 'Alitan ng magkapitbahay',
  'Boundary or fence disagreements': 'Hindi pagkakasundo sa hangganan o bakod',
  'Complaints are not mediated': 'Hindi pinagtutulungang ayusin ang mga reklamo',
  'Unclear process for filing a complaint': 'Hindi malinaw ang proseso ng pagsasampa ng reklamo',

  'How likely are you to use online forms to register or authorize your tenant with the HOA?':
    'Gaano mo kalamang gamitin ang mga online na porma upang irehistro o i-awtorisa ang iyong nangungupahan sa HOA?',
  'How likely are you to use online tenant and lessee forms that you can submit from home?':
    'Gaano mo kalamang gamitin ang mga online na porma para sa nangungupahan na maisusumite mo mula sa bahay?',
  Step: 'Hakbang',
  of: 'sa',

  "Your interview interest was saved separately from your survey answers.": "Nai-save nang hiwalay sa iyong mga sagot sa survey ang iyong interes sa panayam.",
  "You can continue to the next screen when ready.": "Maaari kang magpatuloy sa susunod na screen kapag handa ka na.",
  "Some respondents may be invited to a short follow-up interview to explore certain topics from the survey in more depth. This form is separate from your survey answers — what you provide here cannot be linked to them. Taking part is completely voluntary. Providing your details here doesn't guarantee you'll be selected; participants are chosen based on the study's needs and the overall survey results. If you're interested, we'll email you ahead of time before scheduling anything.": "Maaaring imbitahan ang ilang respondent sa maikling follow-up na panayam upang mas malalim na talakayin ang ilang paksa mula sa survey. Hiwalay ang porma na ito sa iyong mga sagot sa survey — hindi maiuugnay ang ibibigay mo rito sa mga ito. Ganap na kusang-loob ang pakikilahok. Hindi garantiya ng pagpili ang pagbibigay ng iyong detalye; pinipili ang mga kalahok batay sa pangangailangan ng pag-aaral at sa kabuuang resulta ng survey. Kung interesado ka, mag-i-email kami sa iyo bago mag-iskedyul ng anuman.",
  "Optional. Complete the fields below and save your interest, or continue without them.": "Opsyonal. Punan ang mga field sa ibaba at i-save ang iyong interes, o magpatuloy nang wala ang mga ito.",
  "A red asterisk (*) means you need to answer that question before you can continue. You may skip this form and continue.": "Ang pulang asterisk (*) ay nangangahulugang kailangan mong sagutin ang tanong bago ka makapagpatuloy. Maaari mong laktawan ang porma na ito at magpatuloy.",
  "Email address": "Email address",
  "Your email is stored separately from your survey answers and is used only to contact you about a possible interview.": "Hiwalay na nakaimbak ang iyong email sa mga sagot mo sa survey at gagamitin lamang upang kontakin ka tungkol sa posibleng panayam.",
  "Preferred interview format": "Gustong format ng panayam",
  "Online — via Google Meet; a link will be emailed before the interview": "Online — sa pamamagitan ng Google Meet; ipapadala ang link sa email bago ang panayam",
  "Face-to-face — at Dear Joe, just outside Camella Homes Tibig, open daily from 8:00 AM to 10:00 PM": "Harapan — sa Dear Joe, sa labas lamang ng Camella Homes Tibig, bukas araw-araw mula 8:00 AM hanggang 10:00 PM",
  "Preferred day(s), select all that apply": "Gustong araw, piliin ang lahat ng naaangkop",
  "Monday": "Lunes",
  "Tuesday": "Martes",
  "Wednesday": "Miyerkules",
  "Thursday": "Huwebes",
  "Friday": "Biyernes",
  "Saturday": "Sabado",
  "Sunday": "Linggo",
  "Preferred time of day": "Gustong oras ng araw",
  "Morning — 8:00 AM to 12:00 NN": "Umaga — 8:00 AM hanggang 12:00 NN",
  "Afternoon — 12:00 NN to 5:00 PM": "Hapon — 12:00 NN hanggang 5:00 PM",
  "Evening — 5:00 PM to 10:00 PM": "Gabi — 5:00 PM hanggang 10:00 PM",
  "Other — enter a specific time": "Iba pa — maglagay ng tiyak na oras",
  "Specific time": "Tiyak na oras",
  "for example, around 6:30 PM": "halimbawa, mga 6:30 PM",
  "Skip for now": "Laktawan muna",
  "Save interview interest": "I-save ang interes sa panayam",
  "Please complete all required fields before submitting.": "Punan ang lahat ng kinakailangang field bago magsumite.",
  "The invitation could not be saved. Please try again.": "Hindi nai-save ang imbitasyon. Pakisubukang muli.",

  "To begin, please confirm both statements.": "Upang magsimula, pakikumpirma ang dalawang pahayag.",
  "I am not 18 or not a resident": "Wala pa akong 18 taong gulang o hindi ako residente",
  "Please tick this box to agree before continuing.": "Lagyan ng tsek ang kahong ito upang sumang-ayon bago magpatuloy.",
  "Please tick this box to confirm you are eligible before continuing.": "Lagyan ng tsek ang kahong ito upang kumpirmahing karapat-dapat ka bago magpatuloy.",
  "Your progress is saved on this device.": "Nase-save sa device na ito ang iyong progreso.",
  "Your choice:": "Napili mo:",
  "Skip to the questions": "Lumaktaw sa mga tanong",
  "Please answer the highlighted question to continue.": "Sagutan ang naka-highlight na tanong upang magpatuloy.",
  "Please answer the highlighted questions to continue.": "Sagutan ang mga naka-highlight na tanong upang magpatuloy.",
  "complete": "kumpleto",

  "Leave the survey?": "Aalis ka ba sa survey?",
  "Your answers so far are saved on this device. You can come back later and resume where you stopped. Nothing is sent until you submit.": "Nase-save sa device na ito ang mga sagot mo sa ngayon. Maaari kang bumalik mamaya at ituloy kung saan ka huminto. Walang ipapadala hangga't hindi ka nagsusumite.",
  "Stay and keep answering": "Manatili at ituloy ang pagsagot",
  "Leave and keep my progress": "Umalis at itago ang aking progreso",
  "Leave and erase my answers from this device": "Umalis at burahin ang aking mga sagot sa device na ito",

  "Close": "Isara",
  "Erase your answers?": "Buburahin ang iyong mga sagot?",
  "This deletes everything you have answered on this device. It cannot be undone.": "Buburahin nito ang lahat ng sinagot mo sa device na ito. Hindi na ito maibabalik.",
  "Go back": "Bumalik",
  "Yes, erase and leave": "Oo, burahin at umalis",
  "Use this on a shared or public device.": "Gamitin ito sa pinagsasaluhan o pampublikong device.",

  "Read this first, then start. You can stop at any time.": "Basahin muna ito bago magsimula. Maaari kang huminto anumang oras.",
  "Please read the information below, then tick both boxes to begin.": "Basahin ang impormasyon sa ibaba, pagkatapos ay lagyan ng tsek ang dalawang kahon upang magsimula.",
  "You can close this page or go back to the homepage.": "Maaari mong isara ang pahinang ito o bumalik sa homepage.",
  "Check your answers. Use Edit to change a section, then submit when you are ready.": "Suriin ang iyong mga sagot. Gamitin ang Baguhin para ayusin ang isang bahagi, pagkatapos ay isumite kapag handa ka na.",
  "A few quick questions about your home. Your answers decide which questions come next.": "Ilang maikling tanong tungkol sa inyong tahanan. Ang mga sagot mo ang magpapasya kung anong mga tanong ang susunod.",
  "Tell us a little about yourself and how you deal with the HOA today.": "Sabihin sa amin ang kaunti tungkol sa iyo at kung paano mo kinakausap ang HOA sa kasalukuyan.",
  "The devices and internet you use help us design something that works for everyone.": "Ang mga device at internet na ginagamit mo ay tumutulong sa amin na magdisenyo ng bagay na akma sa lahat.",
  "Tell us about your internet cost and connection. Pick the answer that fits best.": "Sabihin ang tungkol sa gastos at koneksyon ng iyong internet. Piliin ang pinakaangkop na sagot.",
  "Imagine an HOA website. Tell us how likely you would be to use each feature.": "Isipin ang isang website ng HOA. Sabihin kung gaano mo kalamang gamitin ang bawat tampok.",
  "More about the website: what you would want first, and what might hold you back.": "Higit pa tungkol sa website: ano ang gusto mong mauna, at ano ang maaaring pumigil sa iyo.",
  "How easy is it to reach the HOA today? Say how much you agree with each statement.": "Gaano kadali makontak ang HOA ngayon? Sabihin kung gaano ka sumasang-ayon sa bawat pahayag.",
  "About bringing visitors, workers, and deliveries through the gate.": "Tungkol sa pagpapapasok ng mga bisita, manggagawa, at delivery sa gate.",
  "About street and event closures, and the permits they need.": "Tungkol sa pagsasara ng kalsada at event, at sa mga permit na kailangan.",
  "How you feel about registering online and showing a valid ID.": "Ang nararamdaman mo tungkol sa pagpaparehistro online at pagpapakita ng valid ID.",
  "Your experience as a homeowner dealing with the HOA.": "Ang karanasan mo bilang may-ari ng bahay sa pakikitungo sa HOA.",
  "Your experience as a tenant dealing with the HOA.": "Ang karanasan mo bilang nangungupahan sa pakikitungo sa HOA.",
  "Optional questions about access needs. You can choose Prefer not to say.": "Mga opsyonal na tanong tungkol sa pangangailangan sa accessibility. Maaari mong piliin ang Mas gusto kong hindi sabihin.",
  "The last step: tell us about any problems we may have missed.": "Huling hakbang: sabihin ang anumang problemang maaaring hindi namin natanong.",

  // ---- Likert scales ----
  'Strongly disagree': 'Lubos na hindi sumasang-ayon',
  Disagree: 'Hindi sumasang-ayon',
  Neutral: 'Neutral',
  Agree: 'Sumasang-ayon',
  'Strongly agree': 'Lubos na sumasang-ayon',
  'Very unlikely': 'Hindi malamang',
  Unlikely: 'Hindi gaanong malamang',
  Likely: 'Malamang',
  'Very likely': 'Napakalamang',

  // ---- Step titles / review ----
  'About your household': 'Tungkol sa inyong sambahayan',
  'About you and how you use HOA services': 'Tungkol sa iyo at kung paano mo ginagamit ang mga serbisyo ng HOA',
  'Digital access': 'Access sa digital',
  'Feature interest': 'Interes sa mga tampok',
  'Current HOA service access': 'Kasalukuyang access sa serbisyo ng HOA',
  'Entrance, visitor, and worker permits': 'Mga permit sa pasukan, bisita, at manggagawa',
  'Street and event closure permits': 'Mga permit sa pagsasara ng kalsada at event',
  'Registration, ID verification, and data privacy': 'Rehistrasyon, beripikasyon ng ID, at privacy ng datos',
  'Your household and the HOA': 'Ang inyong sambahayan at ang HOA',
  'Accessibility needs': 'Mga pangangailangan sa accessibility',
  'Open problem discovery': 'Pagtuklas ng iba pang problema',
  'About you': 'Tungkol sa iyo',
  'Not answered': 'Hindi nasagot',
  'What kind of difficulty applies?': 'Anong uri ng hirap ang naaangkop?',
  'Other difficulty': 'Iba pang hirap',
  'Construction, renovation, or repair work with outside workers in the past 12 months?':
    'May konstruksyon, renovation, o pagkukumpuni na may manggagawa mula sa labas sa nakalipas na 12 buwan?',
  'Which devices do you use regularly?': 'Anong mga device ang regular mong ginagamit?',
  'How often do you do transactions online?': 'Gaano ka kadalas gumagawa ng transaksyon online?',
  'Online pre-registration for visitors and workers, with a temporary pass':
    'Online na pre-registration para sa mga bisita at manggagawa, na may pansamantalang pass',
  'Online request for street or event closure permits': 'Online na kahilingan para sa permit sa pagsasara ng kalsada o event',
  'Online tenant and owner forms': 'Online na porma para sa nangungupahan at may-ari',
  'Online registration with a photo of a valid ID': 'Online na rehistrasyon na may larawan ng valid ID',
  'Online channel to send requests and track status': 'Online na paraan para magpadala ng kahilingan at subaybayan ang katayuan',
  'Website with adjustable text, higher contrast, and screen reader support':
    'Website na may naaayos na teksto, mas mataas na contrast, at suporta sa screen reader',
  'Which of these would you want available first?': 'Alin sa mga ito ang gusto mong mauna?',
  'What might keep you from using this website?': 'Ano ang maaaring pumigil sa iyo na gamitin ang website na ito?',
  'Another feature or service': 'Iba pang tampok o serbisyo',
  'Who did you need to bring through the gate?': 'Sino ang kinailangan mong papasukin sa gate?',
  'Waiting at the gate to get a permit or pass takes too long.': 'Masyadong matagal ang paghihintay sa gate para sa permit o pass.',
  'Leaving an ID at the gate is inconvenient.': 'Abala ang pag-iwan ng ID sa gate.',
  'Typical wait at the gate, in minutes': 'Karaniwang paghihintay sa gate, sa minuto',
  'Getting construction or repair workers approved takes too many steps.':
    'Masyadong maraming hakbang ang pagpapa-apruba ng mga manggagawa sa konstruksyon o pagkukumpuni.',
  'I am comfortable uploading a photo of my valid ID.': 'Komportable akong mag-upload ng larawan ng aking valid ID.',
  'I trust that only authorized HOA personnel would see my ID.': 'Pinagkakatiwalaan kong awtorisadong tauhan lamang ng HOA ang makakakita ng aking ID.',
  'Which HOA transactions did your household do?': 'Anong mga transaksyon sa HOA ang ginawa ng inyong sambahayan?',
  'Which HOA requirements did your household deal with as tenants?':
    'Anong mga requirement ng HOA ang hinarap ng inyong sambahayan bilang nangungupahan?',
  'Which HOA requirement was hardest?': 'Anong requirement ng HOA ang pinakamahirap?',
  'Going to the HOA office in person is difficult.': 'Mahirap ang personal na pagpunta sa opisina ng HOA.',
  'Larger text, higher contrast, or screen reader support would help.':
    'Makakatulong ang mas malaking teksto, mas mataas na contrast, o suporta sa screen reader.',
  'Who would use an online service for the household member who needs help?':
    'Sino ang gagamit ng online na serbisyo para sa miyembro ng sambahayang nangangailangan ng tulong?',
  'Which HOA-related problems have you experienced?': 'Anong mga problemang may kinalaman sa HOA ang naranasan mo?',
  'Any other problem with HOA services?': 'May iba pa bang problema sa mga serbisyo ng HOA?',
};

/** Normalise apostrophes so curly and straight quotes match. */
function norm(value: string): string {
  return value.replace(/[‘’]/g, "'");
}

const FIL_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(FIL).map(([key, value]) => [norm(key), value]),
);

const AGREE_PREFIX = /^([1-5]) — (.+)$/;

function lookup(text: string): string | undefined {
  return FIL_NORM[norm(text)];
}

/**
 * Translate one display string. Handles exact copy, "3 — Neutral" scores,
 * "Label (a; b)" O1 summaries and "a, b" / "a; b" lists. Anything unknown stays English.
 */
export function translate(text: string, lang: SurveyLang): string {
  if (lang === 'EN' || !text) return text;
  const exact = lookup(text);
  if (exact) return exact;

  const score = AGREE_PREFIX.exec(text);
  if (score) return `${score[1]} — ${translate(score[2]!, lang)}`;

  const detail = /^(.*?) \((.*)\)$/.exec(text);
  if (detail && lookup(detail[1]!)) {
    const inner = detail[2]!.split('; ').map((part) => translate(part, lang)).join('; ');
    return `${lookup(detail[1]!)} (${inner})`;
  }

  if (text.includes('; ')) return text.split('; ').map((part) => translate(part, lang)).join('; ');
  if (text.includes(', ')) {
    const parts = text.split(', ');
    if (parts.some((part) => lookup(part))) return parts.map((part) => translate(part, lang)).join(', ');
  }

  const other = /^Other: (.*)$/.exec(text);
  if (other) return `${FIL.Other}: ${other[1]}`;
  return text;
}
