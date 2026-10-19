/**
 * Copy for the welcome, consent, resume, and thank-you screens. `**bold**`
 * marks the parts a resident should not miss. Each English line has its
 * Tagalog twin in COPY_FIL with the same phrases marked.
 */
export const COPY = {
  welcomeIntro:
    'This survey is part of a capstone study by **BSIT students of the University of Batangas, Lipa Campus**. The study looks at how online services could make everyday transactions easier for residents of Camella Homes Tibig, including residents who find it hard to visit the HOA office. The study team is exploring a possible collaboration with the Homeowners Association. This is a **student survey and is not an official HOA survey**.',
  welcomeTime: 'The survey takes about **11 to 13 minutes**. Your answers are anonymous.',
  alreadySent:
    'A response was already sent from this device. Continue only if you are a different person. This reminder cannot block a second response.',
  resume: 'Your answers so far are saved on this device. Starting the survey again erases them.',
  consentPrivacy:
    'Your answers in this survey are **anonymous**. We do not ask for your name, and your responses will be reported only as numbers and group totals, such as percentages and averages, and not by name. No answer will be linked to you, your household, or your unit. Written answers, if you choose to give any, will be summarized without names or identifying details.',
  consentVoluntary:
    'Some questions ask about your age, sex, civil status, and disability. You may choose "Prefer not to say" for any of them. **Taking part is voluntary.** You may skip any question you are not comfortable with or stop at any time. Your answers will be used only for this study and handled in line with the **Data Privacy Act of 2012 (Republic Act 10173)**.',
  consentAgree: 'I have read the information above and I agree to take part in this survey.',
  consentEligible: 'I am 18 years old or older, and I own, rent, or live in a home in Camella Homes Tibig.',

  thanksTitle: 'Thank you for taking part.',
  thanksLead:
    'Your response was **submitted and saved**. Thank you for giving your time to this study. Every answer helps us understand what **Camella Homes Tibig residents** need most.',
  thanksInterview:
    'Your interview interest was **saved separately** from your survey answers. We will **email you ahead of time** before scheduling anything.',
  nextTitle: 'What happens next',
  next1Title: 'Your answers are combined',
  next1Body:
    'Your response is **anonymous**. It is added to everyone else\'s and reported only as **group totals**, such as percentages and averages.',
  next2Title: 'The study team reviews the results',
  next2Body:
    'The BSIT study team looks for the **most common needs and problems** among residents, and which online services could help most.',
  next3Title: 'Findings may be shared',
  next3Body:
    'Findings may be shared with the **Homeowners Association** as part of a possible collaboration. No one can tell which answers were yours.',
  goodTitle: 'Good to know',
  good1: '**You do not need to do anything else.** Your answers are already saved.',
  good2: 'Your saved draft was **cleared from this device** after you submitted.',
  shareTitle: 'Help us reach more residents',
  shareBody:
    'Know a neighbor who has not answered yet? **Share the survey link** with them. Each person answers once, for themselves.',
  copyLink: 'Copy survey link',
  linkCopied: 'Link copied',
  backHome: 'Back to the homepage',
} as const;

export const COPY_FIL: Record<string, string> = {
  [COPY.welcomeIntro]:
    'Ang survey na ito ay bahagi ng capstone study ng mga **mag-aaral ng BSIT ng University of Batangas, Lipa Campus**. Tinitingnan ng pag-aaral kung paano mapapadali ng mga online na serbisyo ang pang-araw-araw na transaksyon ng mga residente ng Camella Homes Tibig, kasama ang mga residenteng nahihirapang pumunta sa opisina ng HOA. Sinusuri ng grupo ang posibleng pakikipagtulungan sa Homeowners Association. Ito ay **survey ng mga mag-aaral at hindi opisyal na survey ng HOA**.',
  [COPY.welcomeTime]:
    'Tumatagal ang survey nang humigit-kumulang **11 hanggang 13 minuto**. Anonymous ang iyong mga sagot.',
  [COPY.alreadySent]:
    'May naipadala nang sagot mula sa device na ito. Magpatuloy lamang kung ibang tao ka. Hindi hinaharang ng paalalang ito ang pangalawang sagot.',
  [COPY.resume]:
    'Ang mga sagot mo sa ngayon ay nase-save sa device na ito. Ang pagsisimulang muli ng survey ay magbubura sa mga ito.',
  [COPY.consentPrivacy]:
    '**Anonymous** ang iyong mga sagot sa survey na ito. Hindi namin hinihingi ang iyong pangalan, at iuulat lamang ang mga sagot bilang mga numero at kabuuan ng grupo, tulad ng porsyento at average, hindi ayon sa pangalan. Walang sagot na maiuugnay sa iyo, sa iyong sambahayan, o sa iyong unit. Ang mga nakasulat na sagot, kung magbibigay ka, ay bubuurin nang walang pangalan o anumang makakakilanlan.',
  [COPY.consentVoluntary]:
    'May ilang tanong tungkol sa iyong edad, kasarian, civil status, at kapansanan. Maaari mong piliin ang "Mas gusto kong hindi sabihin" sa alinman sa mga ito. **Kusang-loob ang pakikilahok.** Maaari mong laktawan ang anumang tanong na hindi ka komportableng sagutin o huminto anumang oras. Gagamitin lamang ang iyong mga sagot sa pag-aaral na ito at hahawakan alinsunod sa **Data Privacy Act of 2012 (Republic Act 10173)**.',
  [COPY.consentAgree]: 'Nabasa ko ang impormasyon sa itaas at sumasang-ayon akong lumahok sa survey na ito.',
  [COPY.consentEligible]:
    'Ako ay 18 taong gulang pataas, at nagmamay-ari, umuupa, o nakatira sa isang bahay sa Camella Homes Tibig.',

  [COPY.thanksTitle]: 'Salamat sa iyong pakikilahok.',
  [COPY.thanksLead]:
    'Ang sagot mo ay **naisumite at nai-save na**. Salamat sa oras na inilaan mo sa pag-aaral na ito. Bawat sagot ay tumutulong sa amin na maunawaan kung ano ang pinakakailangan ng mga **residente ng Camella Homes Tibig**.',
  [COPY.thanksInterview]:
    'Ang iyong interes sa panayam ay **hiwalay na nai-save** sa iyong mga sagot sa survey. **Mag-eemail kami nang maaga** bago magtakda ng anumang iskedyul.',
  [COPY.nextTitle]: 'Ano ang susunod na mangyayari',
  [COPY.next1Title]: 'Pinagsasama ang mga sagot',
  [COPY.next1Body]:
    '**Anonymous** ang iyong sagot. Idinadagdag ito sa sagot ng iba at iuulat lamang bilang **kabuuan ng grupo**, tulad ng porsyento at average.',
  [COPY.next2Title]: 'Sinusuri ng grupo ang mga resulta',
  [COPY.next2Body]:
    'Hinahanap ng grupo ng BSIT ang **pinakakaraniwang pangangailangan at problema** ng mga residente, at kung aling mga online na serbisyo ang pinakamakakatulong.',
  [COPY.next3Title]: 'Maaaring ibahagi ang mga natuklasan',
  [COPY.next3Body]:
    'Maaaring ibahagi ang mga natuklasan sa **Homeowners Association** bilang bahagi ng posibleng pakikipagtulungan. Walang makakaalam kung alin ang mga sagot mo.',
  [COPY.goodTitle]: 'Mabuting malaman',
  [COPY.good1]: '**Wala ka nang kailangang gawin.** Nai-save na ang iyong mga sagot.',
  [COPY.good2]: 'Ang na-save mong draft ay **binura na sa device na ito** pagkatapos mong magsumite.',
  [COPY.shareTitle]: 'Tulungan kaming maabot ang mas maraming residente',
  [COPY.shareBody]:
    'May kilala kang kapitbahay na hindi pa nakasasagot? **Ibahagi ang link ng survey** sa kanila. Isang beses lang sumasagot ang bawat tao, para sa sarili nila.',
  [COPY.copyLink]: 'Kopyahin ang link ng survey',
  [COPY.linkCopied]: 'Nakopya na ang link',
  [COPY.backHome]: 'Bumalik sa homepage',
};
