#!/usr/bin/env node
/**
 * DEMO DATA ONLY. Submits synthetic responses to the SENYAL interview Google Form
 * so the analytics dashboard has something to show. Delete these rows from the
 * form's response sheet before real participant data is collected.
 *
 * Usage:
 *   node scripts/submit-senyal-demo-responses.mjs                 # dry run, prints 2 samples
 *   node scripts/submit-senyal-demo-responses.mjs --send          # submits 30 responses
 *   node scripts/submit-senyal-demo-responses.mjs --send --count 30 --seed 42
 *   node scripts/submit-senyal-demo-responses.mjs --dump out.json # write generated answers to file
 *
 * Flags: --send, --count N (default 30), --seed N, --min-delay ms, --max-delay ms, --dump file
 */
import { writeFileSync } from 'node:fs';

const FORM_ID = '1FAIpQLSd1zcOS_ro-3VlvY_SUPmcCQ4ONBg4MVGejT9GYoWvXHay6sw';
const POST_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
const PAGE_HISTORY = '0,1,2,3,4,5,6,7';

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const SEND = flag('send');
const COUNT = Number(val('count', 30));
const SEED = Number(val('seed', Date.now() % 2 ** 31));
const MIN_DELAY = Number(val('min-delay', 2500));
const MAX_DELAY = Number(val('max-delay', 7000));
const DUMP = val('dump', null);

// ---------- rng ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const chance = (p) => rnd() < p;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
  return pairs[0][0];
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- entry ids ----------
const E = {
  consent: 756462192,
  commPref: 172528835, methods: 606103288, otherExplain: 1488538817, situations: 1201218926, hearingShould: 2143982094,
  easy: 2108634174, difficult: 1195482121, home: 1097242164, school: 844026543, friends: 973192633, work: 398272317,
  hospital: 1930560445, gov: 983502503, publicPlaces: 13274472, misunderstand: 139991881, cannotExpress: 1728434097,
  responds: 1151705881, notParticipate: 1460624021,
  growing: 1860444998, familyComm: 1183165462, understood: 1108063818, included: 1737275903, schoolShape: 1943865003,
  learnLang: 2040831104, support: 209774893, wish: 1721305390,
  difficulties: 1354695796, environments: 1099943360, hearingNotUnderstand: 1281559013, infoAccess: 766251895,
  barriersAffect: 960571720, whatDo: 1768318521, approaches: 1216442718, changes: 1662103173,
  comfortable: 203444215, understandsMe: 1730118891, supportBy: 12558143, tryButDifficult: 627909948,
  unfamiliarHelp: 1706185994, interpreter: 520035468, wishSupport: 396016534, hearingCanDo: 1820529363, independent: 859252991,
  initial: 1449275199, usefulSituations: 1554209615, cameraComfort: 1528782614, concerns: 1621427332, uncertain: 963511963,
  accessible: 103916382, output: 197880466, outputExplain: 419421806, limitations: 956539920, advice: 1131422025,
  gUnderstand: 1835351144, gMessage: 1857061153, gNotAsked: 408177409,
};

// ---------- answer pools ----------
// Mood-indexed pools: index 0 = easier/more positive experience, last = harder. 4 variants each.
const M = {
  easy: [
    'Talking with my Deaf friends at the FSL club. Everyone signs, so there is no need to repeat anything and we can talk for hours.',
    'At home with my sister, because she learned FSL with me. We can even joke around without writing anything down.',
    'When the other person is patient and willing to write or use their phone. A short chat at a store can feel easy that way.',
    'Honestly it is only easy in small settings like my family dinner table, where everyone already knows how I communicate.',
  ],
  difficult: [
    'Once at a bank, the teller kept talking fast and I could not follow. I had to write everything, which took a long time, but she eventually understood.',
    'In a jeepney I asked for a stop and the driver did not hear my gestures. I ended up going past my destination and walking back.',
    'At a clinic the nurse called my name and I did not know. I almost lost my turn because nobody came to tell me directly.',
    'When I went to apply for something at the city hall, nobody could sign and they kept getting impatient. I left without finishing and felt very small.',
  ],
  home: [
    'Mostly fine. My parents and siblings know basic FSL and we use signs and gestures every day.',
    'It is okay. Some family members sign well, others only use simple gestures, so I sometimes explain twice.',
    'Depends on who is home. With my mother it is easy, with my uncles I usually write on my phone.',
    'Family members mean well but most do not sign, so I miss a lot of what is said during meals and gatherings.',
  ],
  school: [
    'Good now. My school has an interpreter during major lessons and my classmates are curious to learn signs.',
    'Mixed. Teachers try, but when the lesson is only spoken I rely on slides, notes, and copying from classmates.',
    'Hard in regular classes because teachers talk while facing the board. I often ask a seatmate afterwards.',
    'Not easy. There was no interpreter and I mostly taught myself from books. Group work was the worst.',
  ],
  friends: [
    'Very good with my Deaf friends because we all sign. We hang out, play games, and talk without problems.',
    'Fine with close friends. In bigger groups with hearing people the conversation moves too fast for me.',
    'I join but I often feel like I am watching, not talking. Friends sometimes forget to include me in the jokes.',
    'Mostly I stay with Deaf friends because mixed groups can be tiring and lonely.',
  ],
  workEmployed: [
    'My workplace is supportive. My supervisor learned some FSL and we write instructions on a shared chat when needed.',
    'Day to day tasks are fine, but meetings are difficult. I ask for the notes afterwards or read the minutes.',
    'I get instructions through text and written notes. It works, but small talk with coworkers rarely happens.',
    'Meetings and trainings are hard because they are all spoken. I sometimes miss announcements and only learn about them later.',
  ],
  workStudent: [
    'I do not have a regular job yet, only a part-time task for my family business. We communicate by gestures and writing and it is fine.',
    'Not working right now, I am still a student. I did an internship once and used chat for most instructions.',
    'No job at the moment. I worry about interviews because employers might not know how to communicate with me.',
    'I have not been able to find work. In the interviews I tried, they asked me to just write answers and it felt rushed.',
  ],
  workJobless: [
    'Not employed at the moment, but when I did odd jobs my coworkers were kind and used gestures with me.',
    'Currently looking for work. Past jobs were okay when the tasks were clear and written down.',
    'I am not working now. Interviews were the hardest part because many companies do not provide an interpreter.',
    'No work now. I was turned down a few times after they found out I could not use the phone.',
  ],
  hospital: [
    'The last time my parent came with me and helped. Without them I use written notes, and most staff were kind.',
    'Usually okay if I bring a note describing my symptoms. The hard part is understanding the doctor\'s explanation.',
    'I find it stressful. Staff call names out loud and I have to keep watching the counter so I do not miss my turn.',
    'Very difficult. There is rarely an interpreter, and I have left without fully understanding my medicine.',
  ],
  gov: [
    'Fine when the process is mostly forms. I just prepare my documents and hand them over.',
    'It takes longer than usual. I write my questions down and wait for staff to write back.',
    'Often confusing. Many officers speak only and do not know what to do when I cannot hear them.',
    'Frustrating. I always need someone to come with me, which takes away my independence.',
  ],
  publicPlaces: [
    'Mostly easy. I point, show my phone, or write the price and it works fine at shops.',
    'It depends. In busy places like terminals and malls I rely on signs and screens, and I get lost when announcements are only spoken.',
    'Sometimes people ignore me or speak too loudly at me, which does not help at all.',
    'Not comfortable. Announcements in stations and buses are all voice so I always ask other passengers or just stay alert.',
  ],
  misunderstand: [
    'Usually when people talk too fast or cover their mouths. A short, clear message makes it much better.',
    'Different sign meanings in different places, and also people assuming I understood because I nodded.',
    'People assume that all Deaf people can lip-read, but I can only catch a few words. This creates a lot of wrong guesses.',
    'Because most people do not know how to talk to a Deaf person, they give up and then misunderstand everything.',
  ],
  cannotExpress: [
    'Sometimes, mostly in emergencies or when I need to explain something detailed. In daily life I manage.',
    'Yes, in medical and legal situations. The words are complicated and I do not always have the vocabulary.',
    'Yes, quite often. When there is no interpreter I can not explain what I need or understand the answer.',
    'Yes, a lot. Even in simple things like returning an item, I have to rely on someone else to speak for me.',
  ],
  responds: [
    'Some people try different ways like writing or showing pictures, and I really appreciate that.',
    'Many people smile and repeat the same words louder, which does not help, but a few take out their phone.',
    'Often they get awkward and look for someone else to talk to instead of me.',
    'A lot of people just stop talking to me or say "never mind", and I feel like a burden.',
  ],
  notParticipate: [
    'Not really, but sometimes I think twice before joining big events without an interpreter.',
    'Yes, sometimes. I skip talks and seminars if there are no captions or interpreter.',
    'Yes. I avoid phone calls, group meetings, and gatherings where I know nobody signs.',
    'Yes, often. It is easier to stay home than to feel lost and embarrassed again.',
  ],
  // Part C (optional) ---------------------------------------------
  growing: [
    'I was lucky to enter a Deaf school early and learned FSL there. It gave me a place where I belonged.',
    'It was a mix. At home we used gestures, and at school it was mostly lip-reading and copying notes.',
    'Lonely at times. I understood very little at family gatherings until I learned to sign as a teenager.',
    'Hard. I was expected to speak and was scolded when I could not, so I stopped trying for a long time.',
  ],
  familyComm: [
    'My parents learned signs with me, slowly, from videos and from the Deaf community.',
    'Home signs and pointing. We invented our own signs for common things like food and chores.',
    'Mostly gestures and writing. Deeper conversations were hard.',
    'They talked to me mostly by speaking, so I often just nodded.',
  ],
  understood: [
    'Mostly yes, my immediate family and teachers understood.',
    'Some did. My mother always did, but extended family did not really.',
    'Only a few people. Most just guessed what I meant.',
    'Almost no one outside the Deaf school understood my signs.',
  ],
  included: [
    'I felt included in Deaf events and school activities. Excluded at big hearing gatherings.',
    'Both. Included when someone took time to translate, excluded when everyone laughed and I did not know why.',
    'More often excluded, especially at parties and family reunions.',
    'Excluded most of the time. I remember sitting alone while everyone talked.',
  ],
  schoolShape: [
    'It made me confident to sign with teachers and classmates, and I made lifelong friends.',
    'I became good at writing and reading faces because I had to, but speaking up in class stayed hard.',
    'I became shy and avoided asking questions, since it took too long to be understood.',
    'I fell behind a lot because the lessons were not accessible, and it made me doubt myself.',
  ],
  learnLang: [
    'Yes, I joined FSL classes and a Deaf youth group.',
    'A bit. I learned FSL late, from friends and from videos online.',
    'Limited. There were not many places that taught FSL near us.',
    'Hardly any. I learned most of it as an adult, not as a child.',
  ],
  support: [
    'Interpreters, captioned videos, and teachers who faced me when they spoke.',
    'Visual aids and written instructions. Also a patient friend who explained things.',
    'Having one person who understood me, like my sister, made the biggest difference.',
    'Honestly very little, but my Deaf friends helped me feel understood.',
  ],
  wish: [
    'That being Deaf is not a sad thing. I just communicate in a different way.',
    'That I can do many things, I just need clear and visual communication.',
    'That I am not slow or rude when I do not respond. I just did not hear them.',
    'That they should have learned some signs. It would have changed so much for me.',
  ],
  // Part D -------------------------------------------------------
  difficulties: [
    'Mainly in group conversations and phone-based things. One-on-one I can handle.',
    'Following fast speech, understanding announcements, and talking to strangers who do not sign.',
    'Not being able to get information in real time, like announcements, calls, or news without captions.',
    'Almost every interaction with hearing people who do not sign. I have to think about how to communicate before I even start.',
  ],
  environments: [
    'Noisy places like malls and markets, and also meetings.',
    'Hospitals, government offices, and public transportation.',
    'Schools without interpreters, workplaces, and any place that relies on spoken announcements.',
    'Everywhere outside of my home and Deaf community, really.',
  ],
  hearingNotUnderstand: [
    'I try again with simpler signs or write it down. Most of the time that works.',
    'I take out my phone and type. If they still do not get it, I ask someone nearby to help.',
    'Usually they just say "okay" without understanding, and later I find out there was a mistake.',
    'They get impatient and walk away. I feel ignored, and it makes me hesitate to ask again.',
  ],
  infoAccess: [
    'Rarely. Most of what I need is available online or in writing.',
    'Yes, sometimes, like announcements at school or work that were only said aloud.',
    'Yes. During typhoon warnings and news, for example, not everything has captions or sign language.',
    'Yes, many times. I often learn about important things days later, from other Deaf friends.',
  ],
  barriersAffect: [
    'A little. I can join most things if I prepare ahead and bring materials.',
    'They limit me in group discussions and events. I join less than I want to.',
    'Quite a lot. I miss opportunities because I only hear about them late or not at all.',
    'Deeply. I have given up on some jobs and classes because the barriers were just too much.',
  ],
  whatDo: [
    'I stay calm, write it down, or use pictures. Most people respond well to that.',
    'I use gestures and my phone notes, and sometimes ask a family member to come over.',
    'I try one or two ways and if they still do not understand I just stop and go.',
    'Usually I give up and nod politely, even if I did not understand.',
  ],
  approaches: [
    'Helpful: facing me, speaking slowly, using simple words, writing. Not helpful: shouting or exaggerating their mouth.',
    'Writing and typing help the most. Talking while looking away makes it much harder.',
    'Patience is the main thing. Being rushed, or being treated like I am not smart, makes it worse.',
    'Helpful is when they try to learn a few signs. Unhelpful is when they speak to my companion instead of me.',
  ],
  changes: [
    'More captions and visual announcements in public spaces.',
    'More people who know basic FSL, especially in schools, clinics, and offices.',
    'Interpreters available in government and hospitals without us having to ask or pay.',
    'A society that sees Deaf people as capable, plus real accessibility in every public service.',
  ],
  // Part E -------------------------------------------------------
  comfortable: [
    'My Deaf friends, because we share the same language and experiences, and I never feel judged.',
    'My family, especially my mother, since she knows how I express myself.',
    'My close hearing friend who learned FSL. She is patient and explains what I miss.',
    'Honestly, only people who already know me. With strangers I feel nervous.',
  ],
  understandsMe: [
    'My Deaf friends and community, and my interpreter when there is one.',
    'My parents and siblings. They have learned what my signs and gestures mean.',
    'A few teachers and one cousin. Others just guess.',
    'Very few people. Mostly the ones who have known me for years.',
  ],
  supportBy: [
    'They help translate, remind me of schedules, and make sure I do not miss announcements.',
    'My classmates share notes, and some teachers give extra written explanations.',
    'Coworkers sometimes send messages when something changes. It is small but helpful.',
    'Support is there from a few people but it depends on their time. I wish it was more consistent.',
  ],
  tryButDifficult: [
    'Yes, some people try their best but do not know FSL, so we use writing and it goes okay.',
    'Yes, especially older relatives. They love me but cannot follow my signs.',
    'Yes, and they often get frustrated, then I feel guilty for something that is not my fault.',
    'Many, honestly. Their effort is appreciated but the gap is huge.',
  ],
  unfamiliarHelp: [
    'I ask politely using written notes or my phone, and most people help.',
    'I look for someone who looks friendly and show them a message on my phone.',
    'I wait for a companion or search for a Deaf friend to come, because it is hard on my own.',
    'I usually avoid it. If I have no one, I just try to finish quickly without asking.',
  ],
  interpreter: [
    'Yes, at school events and a few seminars. It was very helpful and I felt equal to others.',
    'Sometimes, usually for big events only. For everyday things, no.',
    'Rarely. I had to ask days earlier and the interpreter was not always available.',
    'Not really. I have only had an interpreter a few times in my life, and each time it was a huge relief.',
  ],
  wishSupport: [
    'More FSL classes for families and the public, and local interpreters.',
    'Accessible hotlines and text-based emergency services.',
    'Community programs where hearing and Deaf people can interact and learn from each other.',
    'Real support in jobs and training, not just one-time events.',
  ],
  hearingCanDo: [
    'Face me when you talk, be patient, and ask how I prefer to communicate.',
    'Learn a few signs, even just basic ones like thank you and sorry. It means a lot.',
    'Talk to me, not to my interpreter or my companion. Include me in the conversation.',
    'Do not pity me or assume I cannot do things. Just give me equal chance and respect.',
  ],
  independent: [
    'Having accessible tools and information in text or signs so I do not have to depend on others.',
    'Interpreters and captions in key services, and more people who know FSL.',
    'A device or app that can help me talk with hearing people quickly would make a big difference.',
    'If society treated Deaf communication as normal and not special, I think everything would be easier.',
  ],
  // Part F -------------------------------------------------------
  initial: [
    'Excited! It sounds like it could really help us talk to hearing people without always needing an interpreter.',
    'Interesting and promising. I would want to try it first before deciding if it is good.',
    'I am curious, but I worry that it might not understand FSL properly since signs differ by region.',
    'Not sure. Many apps say they help the Deaf but do not work well in real life.',
  ],
  usefulSituations: [
    'At stores, clinics, and offices when no interpreter is available, and at school for quick questions.',
    'During emergencies, and at government offices where I always need help.',
    'Ordering food, asking directions, and basic conversations with neighbors or classmates.',
    'Maybe for simple things only, like asking prices or directions. I would not trust it for medical use yet.',
  ],
  cameraComfort: [
    'Yes, I am comfortable, as long as it does not keep recording my face or save my videos.',
    'Yes, if it is clear when it is on and off. I want to control it myself.',
    'Somewhat. I would use it in public places but not in private or personal conversations.',
    'Not really. A camera pointed at me while I sign feels very personal, and I worry about who sees the video.',
  ],
  concerns: [
    'Mostly accuracy, because a wrong translation can cause big problems, especially in a hospital.',
    'Privacy. Who keeps the video and for how long? I want it deleted right away.',
    'That it will not recognize my signing style or regional signs, then I look like I said something wrong.',
    'All of them. If it makes mistakes and no one corrects it, the Deaf person gets blamed.',
  ],
  uncertain: [
    'It should show a few possible words and let me choose the right one.',
    'It should ask me to repeat the sign instead of guessing.',
    'It should show a clear message like "not sure" rather than a wrong answer, so we can try again.',
    'It should never speak out a guess. Please let me confirm first before anything is said to the other person.',
  ],
  accessible: [
    'Simple screen, big text, works offline, and supports FSL not only other sign languages.',
    'Test it with Deaf users from different regions. Include us in the design from the start.',
    'Fast response, good lighting tolerance, and not needing an expensive phone.',
    'It must be free or cheap, and easy enough for older Deaf people who are not good with technology.',
  ],
  limitations: [
    'FSL has regional variations and facial expressions that carry grammar. Developers must understand this.',
    'Not every Deaf person has the same level of literacy, so text-only output may not be enough.',
    'Do not assume all Deaf people sign the same way. Also, lighting, background, and phone quality matter a lot.',
    'A tool cannot replace interpreters and real human connection. It should be a support, not a replacement.',
  ],
  advice: [
    'Involve Deaf people from start to finish. Nothing about us without us.',
    'Test with many Deaf users, not only a few, and be willing to change the design based on what we say.',
    'Be humble. Listen to feedback, be honest about what the tool can and cannot do.',
    'Protect our privacy and our language. Please do not make a tool that makes hearing people think they no longer need to learn FSL.',
  ],
  // Part G (optional) ---------------------------------------------
  gUnderstand: [
    'That Deaf people are not less capable. We just use a different language.',
    'That being patient does not take much effort, but it changes our day.',
    'That daily life has many small barriers that hearing people never notice.',
    'That feeling left out because of communication is tiring, and it adds up over the years.',
  ],
  gMessage: [
    'Please face us, speak clearly, and be patient. A smile also helps.',
    'Learn a few signs. Even a simple "hello" in FSL will make us feel welcome.',
    'Do not shout, and do not talk about us as if we are not there.',
    'Treat us as equals. We are not asking for pity, only for access and respect.',
  ],
  gNotAsked: [
    'Maybe ask how Deaf people feel about cost of the tool, because many cannot afford new devices.',
    'I think the questions covered everything. Thank you for including us.',
    'Please also interview older Deaf people, since their experience might be different.',
    'Training for hearing people should be part of the research too, not just a tool for Deaf people.',
  ],
};

// Profile-keyed pools (3 variants each) -------------------------
const P = {
  commPref: {
    fslFirst: [
      'I am Deaf and my first language is Filipino Sign Language. Please describe me as an FSL user.',
      'Deaf, FSL signer. I also write or type when talking to hearing people.',
      'I prefer to be described as a Deaf person who communicates mainly through FSL and visual communication.',
    ],
    mixed: [
      'I use FSL, writing, and some lip-reading depending on who I am talking to.',
      'A Deaf person who uses a mix of signing, writing, and gestures.',
      'I would say I use multiple ways: FSL with friends, writing with strangers, and a little speech with family.',
    ],
    oral: [
      'Hard of hearing. I mostly use speech and lip-reading, and I am still learning FSL.',
      'I am hard of hearing and rely on lip-reading and hearing aids, along with writing when needed.',
      'Please describe me as a person who communicates through speech, lip-reading, and written notes.',
    ],
  },
  situations: {
    fslFirst: [
      'FSL is best with Deaf friends and family. Writing is useful at stores and offices, and gestures for quick things.',
      'FSL for deep or long conversations, typing for appointments and formal things, gestures when in a hurry.',
      'FSL at school and community events. Writing on my phone when I talk to hearing people I do not know.',
    ],
    mixed: [
      'Signing with Deaf friends, writing in offices, lip-reading with family at home, and gestures when it is noisy.',
      'It depends on the person. Lip-reading works one-on-one, but in groups I prefer FSL or writing.',
      'Writing for important information, FSL for comfort, and gestures for simple needs like ordering food.',
    ],
    oral: [
      'Speech and lip-reading are fine one-on-one in quiet places. In noisy places I rely on writing or my phone.',
      'Hearing aids and lip-reading at home, writing for the doctor and other formal places.',
      'I use speech when the place is quiet, and typing on my phone when I need to be sure the message is correct.',
    ],
  },
  hearingShould: {
    fslFirst: [
      'That I am Deaf, so please face me, do not shout, and be patient. If you do not sign, we can write.',
      'Please do not assume I can lip-read. Ask me first how I prefer to communicate.',
      'Get my attention with a wave or a tap, not by calling out. Then speak or write clearly.',
    ],
    mixed: [
      'Look at me when you talk, speak clearly but not too slow, and be ready to write if I miss something.',
      'I can understand some words but not all. Please repeat in a different way if I look confused.',
      'Ask me what works best. Some days lip-reading is okay, other days I need it written.',
    ],
    oral: [
      'Face me, do not cover your mouth, and speak at a normal pace. Noise makes everything harder for me.',
      'Please do not shout, and do not exaggerate your lips. Just be clear and patient.',
      'I may nod even if I did not understand. Please check with me, kindly.',
    ],
  },
  otherExplain: {
    fslFirst: [
      'I use FSL most of the time, but with hearing people I switch to writing.',
      'I sometimes use a video call with sign language when I cannot meet in person.',
      'I use home signs with my family that are not exactly standard FSL.',
    ],
    mixed: [
      'I combine everything depending on the situation, so it is hard to choose just one.',
      'I also use pictures and my phone notes when the place is noisy.',
      'Sometimes I use a messaging app because texting is easier than talking.',
    ],
    oral: [
      'I use hearing aids too, but they do not help much in crowded places.',
      'Speech works for me but I need people to repeat sometimes.',
      'I use captions on my phone for videos and meetings.',
    ],
  },
};

const OUTPUT_EXPLAIN = {
  'Text': [
    'Text is the most reliable for me because I can read and confirm the message before it is sent.',
    'I read faster than I listen, so text is better. It is also more private in public places.',
  ],
  'Speech': [
    'Speech would help hearing people respond right away, so there is no need for them to read.',
    'If the other person is busy, like a cashier, speech is quicker for them.',
  ],
  'Both text and speech': [
    'Both. I want to see what the system understood in text and also let the other person hear it.',
    'Text for me to check the translation, and speech for the hearing person so the conversation flows.',
  ],
  'It depends on the situation': [
    'In noisy places I would use text, and speech when the other person is not looking at the screen.',
    'At a clinic maybe both, at a store just text. It really depends on the situation and the person.',
  ],
};

// ---------- persona ----------
const PROFILES = ['fslFirst', 'fslFirst', 'fslFirst', 'mixed', 'mixed', 'oral'];
const STYLES = [
  ['plain', 30],
  ['formal', 20],
  ['casual', 25],
  ['terse', 12],
  ['verbose', 13],
];
const WORK = [['employed', 35], ['student', 30], ['jobless', 20], ['selfEmployed', 15]];

function makePersona() {
  const profile = pick(PROFILES);
  const style = weighted(STYLES);
  const taglish = chance(style === 'formal' ? 0.05 : 0.35);
  const mood = Math.min(0.99, Math.max(0, rnd() * 0.8 + (profile === 'oral' ? 0.1 : 0) + (rnd() - 0.5) * 0.2));
  const tech = weighted([[0, 28], [1, 32], [2, 25], [3, 15]]); // 0 excited .. 3 skeptical
  const work = weighted(WORK);
  const sharesGrowing = chance(0.65);
  const sharesFinal = chance(0.5);
  return { profile, style, taglish, mood, tech, work, sharesGrowing, sharesFinal };
}

// pick pool index around mood (or tech) with jitter
function idxFor(n, level, jitter = 0.25) {
  const x = Math.min(1, Math.max(0, level + (rnd() - 0.5) * jitter * 2));
  return Math.min(n - 1, Math.floor(x * n));
}
const pickMood = (pool, p) => pool[idxFor(pool.length, p.mood)];
const pickTech = (pool, p) => pool[Math.min(pool.length - 1, Math.max(0, p.tech + (chance(0.2) ? (chance(0.5) ? 1 : -1) : 0)))];

// ---------- style transforms ----------
const TYPOS = [
  [/\bbecause\b/i, 'becuase'], [/\bunderstand\b/i, 'undertand'], [/\bdefinitely\b/i, 'definately'],
  [/\bcommunicate\b/i, 'comunicate'], [/\bsometimes\b/i, 'sometime'], [/\bthe\b/, 'teh'],
  [/\bwith\b/, 'wiht'], [/\bpeople\b/, 'ppl'], [/\binterpreter\b/i, 'interpretor'], [/\bdifficult\b/i, 'difficullt'],
];
const TAGLISH = [
  [/\bsometimes\b/gi, 'minsan'], [/\bbut\b/g, 'pero'], [/\bbecause\b/g, 'kasi'], [/\bI think\b/g, 'sa tingin ko'],
  [/\balso\b/g, 'din'], [/\bvery\b/g, 'sobrang'], [/\bmost of the time\b/gi, 'madalas'],
];
const EXTRA = [
  'It also depends on how patient the other person is.',
  'This has been my experience for many years now.',
  'I hope this helps the research team understand us better.',
  'Of course this may be different for other Deaf people.',
  'I am sharing this as honestly as I can.',
];
const FILLERS = ['honestly ', 'tbh ', 'for me, ', 'I guess ', 'po, ', 'basically '];

function firstSentence(s) {
  const m = s.match(/^.*?[.!?](\s|$)/);
  return m ? m[0].trim() : s;
}

function styleText(text, p, optional = false) {
  let t = text;
  if (p.taglish) {
    for (const [re, rep] of TAGLISH) if (chance(0.5)) t = t.replace(re, rep);
  }
  switch (p.style) {
    case 'terse': {
      t = firstSentence(t);
      if (chance(0.4)) t = t.replace(/\.$/, '');
      if (chance(0.3) && t.length > 40) t = t.split(/,| but /)[0];
      break;
    }
    case 'verbose':
      if (chance(0.6)) t = `${t} ${pick(EXTRA)}`;
      break;
    case 'casual': {
      if (chance(0.7)) t = t.charAt(0).toLowerCase() + t.slice(1);
      if (chance(0.45)) t = pick(FILLERS) + (t.charAt(0) === 'I' ? t : t.charAt(0).toLowerCase() + t.slice(1));
      if (chance(0.6)) t = t.replace(/\.$/, '');
      t = t.replace(/\bI am\b/g, chance(0.5) ? "I'm" : 'Im').replace(/\bdo not\b/g, chance(0.5) ? "don't" : 'dont').replace(/\bcannot\b/g, "can't");
      if (chance(0.35)) {
        const [re, rep] = pick(TYPOS);
        t = t.replace(re, rep);
      }
      break;
    }
    case 'formal':
      t = t.replace(/\bdon't\b/g, 'do not').replace(/\bcan't\b/g, 'cannot');
      break;
    default:
      break;
  }
  return t.trim();
}

// ---------- response generation ----------
function methodsFor(p) {
  const picks = new Set();
  if (p.profile === 'fslFirst') {
    picks.add('Filipino Sign Language (FSL)');
    if (chance(0.8)) picks.add('Writing or typing');
    if (chance(0.5)) picks.add('Gestures');
    if (chance(0.25)) picks.add('Assistive technology');
    if (chance(0.2)) picks.add('Lip-reading');
  } else if (p.profile === 'mixed') {
    for (const m of shuffle(['Filipino Sign Language (FSL)', 'Writing or typing', 'Lip-reading', 'Speech', 'Gestures'])
      .slice(0, 2 + Math.floor(rnd() * 3))) picks.add(m);
    if (chance(0.3)) picks.add('A combination of methods');
    if (chance(0.15)) picks.add('Assistive technology');
  } else {
    picks.add('Speech');
    picks.add('Lip-reading');
    if (chance(0.7)) picks.add('Writing or typing');
    if (chance(0.45)) picks.add('Assistive technology');
    if (chance(0.3)) picks.add('Filipino Sign Language (FSL)');
  }
  return [...picks];
}

function generate() {
  const p = makePersona();
  const m = (k) => styleText(pickMood(M[k], p), p);
  const t = (k) => styleText(pickTech(M[k], p), p);
  const pr = (k) => styleText(pick(P[k][p.profile]), p);

  const workPool = p.work === 'employed' || p.work === 'selfEmployed' ? M.workEmployed : p.work === 'student' ? M.workStudent : M.workJobless;

  const methods = methodsFor(p);
  const answers = [];
  const add = (k, v) => answers.push([E[k], v]);

  add('consent', 'Yes, I agree to participate');
  // Part A
  add('commPref', pr('commPref'));
  const hasOther = chance(0.12);
  const methodVals = hasOther ? [...methods, '__other_option__'] : methods;
  answers.push([E.methods, methodVals, hasOther ? pick(['Video call with sign language', 'Home signs with family', 'Messaging apps']) : null]);
  if (chance(0.5) || hasOther) add('otherExplain', pr('otherExplain'));
  add('situations', pr('situations'));
  add('hearingShould', pr('hearingShould'));
  // Part B
  add('easy', m('easy'));
  add('difficult', m('difficult'));
  add('home', m('home'));
  add('school', m('school'));
  add('friends', m('friends'));
  add('work', styleText(pickMood(workPool, p), p));
  add('hospital', m('hospital'));
  add('gov', m('gov'));
  add('publicPlaces', m('publicPlaces'));
  add('misunderstand', m('misunderstand'));
  add('cannotExpress', m('cannotExpress'));
  add('responds', m('responds'));
  add('notParticipate', m('notParticipate'));
  // Part C optional
  if (p.sharesGrowing) {
    for (const k of ['growing', 'familyComm', 'understood', 'included', 'schoolShape', 'learnLang', 'support', 'wish']) {
      if (chance(0.85)) add(k, m(k));
    }
  }
  // Part D
  for (const k of ['difficulties', 'environments', 'hearingNotUnderstand', 'infoAccess', 'barriersAffect', 'whatDo', 'approaches', 'changes']) add(k, m(k));
  // Part E
  for (const k of ['comfortable', 'understandsMe', 'supportBy', 'tryButDifficult', 'unfamiliarHelp', 'interpreter', 'wishSupport', 'hearingCanDo', 'independent']) add(k, m(k));
  // Part F
  add('initial', t('initial'));
  add('usefulSituations', t('usefulSituations'));
  add('cameraComfort', t('cameraComfort'));
  add('concerns', t('concerns'));
  add('uncertain', m('uncertain'));
  add('accessible', m('accessible'));
  const output = weighted([
    ['Text', 25], ['Speech', 6], ['Both text and speech', 32], ['It depends on the situation', 37],
  ]);
  add('output', output);
  add('outputExplain', styleText(pick(OUTPUT_EXPLAIN[output]), p));
  add('limitations', m('limitations'));
  add('advice', m('advice'));
  // Part G optional
  if (p.sharesFinal) {
    for (const k of ['gUnderstand', 'gMessage', 'gNotAsked']) if (chance(0.7)) add(k, m(k));
  }
  return { persona: p, answers };
}

function toBody(answers) {
  const body = new URLSearchParams();
  for (const [id, v, otherText] of answers) {
    if (Array.isArray(v)) {
      for (const x of v) body.append(`entry.${id}`, x);
      if (otherText) body.append(`entry.${id}.other_option_response`, otherText);
    } else {
      body.append(`entry.${id}`, v);
    }
  }
  body.append('pageHistory', PAGE_HISTORY);
  body.append('fvv', '1');
  body.append('fbzx', String(Math.floor(rnd() * 2 ** 53)));
  return body;
}

async function submit(answers) {
  const res = await fetch(POST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    body: toBody(answers).toString(),
  });
  const html = await res.text();
  const ok = res.status === 200 && /response has been recorded|Thank you for sharing your experiences|Submit another response|Magsumite ng iba pang tugon|freebirdFormviewerViewResponseConfirmContentContainer/i.test(html);
  if (!ok && process.env.DEBUG_HTML) writeFileSync(process.env.DEBUG_HTML, html);
  return { ok, status: res.status };
}

// ---------- main ----------
const responses = Array.from({ length: COUNT }, generate);

if (DUMP) {
  writeFileSync(DUMP, JSON.stringify(responses, null, 2));
  console.log(`wrote ${responses.length} generated responses to ${DUMP}`);
}

if (!SEND) {
  console.log(`DRY RUN (seed ${SEED}). Nothing submitted. Add --send to submit ${COUNT} responses.\n`);
  for (const r of responses.slice(0, 2)) {
    console.log('persona:', JSON.stringify(r.persona));
    for (const [id, v] of r.answers.slice(0, 12)) {
      const key = Object.keys(E).find((k) => E[k] === id);
      console.log(`  ${key}: ${Array.isArray(v) ? v.join(' | ') : v}`);
    }
    console.log(`  ... (${r.answers.length} answers total)\n`);
  }
  const styles = {};
  for (const r of responses) styles[r.persona.style] = (styles[r.persona.style] || 0) + 1;
  console.log('style mix:', styles);
  process.exit(0);
}

console.log(`Submitting ${COUNT} demo responses (seed ${SEED})...`);
let done = 0;
for (let i = 0; i < responses.length; i++) {
  const { ok, status } = await submit(responses[i].answers);
  if (!ok) {
    console.error(`#${i + 1} FAILED (HTTP ${status}). Stopping so the count stays accurate. Submitted so far: ${done}.`);
    process.exit(1);
  }
  done++;
  console.log(`#${i + 1}/${COUNT} ok`);
  if (i < responses.length - 1) await sleep(MIN_DELAY + rnd() * (MAX_DELAY - MIN_DELAY));
}
console.log(`Done. ${done} responses submitted.`);
