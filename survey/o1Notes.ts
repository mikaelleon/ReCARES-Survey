/**
 * Open problem discovery: what each choice covers, with the concrete situations
 * that count. Shown under a choice once it is selected. Keyed by the exact
 * choice text, which is also the stored answer, so wording here never changes
 * what is saved.
 */
type Pair = [en: string, fil: string];

export const O1_ITEM_NOTES: Record<string, Pair> = {
  // ---- Water ----
  'Frequent water interruptions or no water supply': [
    'Counts taps running dry several times a week, or a supply that is often completely off.',
    'Kasama rito ang mga gripong nawawalan ng tubig nang ilang beses sa isang linggo, o suplay na madalas na ganap na walang tubig.',
  ],
  'Water interruptions happen without advance notice': [
    'Counts the water suddenly going off with no text, announcement, or posted notice beforehand.',
    'Kasama rito ang biglaang pagkawala ng tubig na walang text, anunsyo, o abisong ipinaskil.',
  ],
  'Scheduled interruptions are announced too late': [
    'Counts notices that arrive on the same day, or after the water is already off, leaving no time to store water.',
    'Kasama rito ang mga abisong dumarating sa mismong araw, o pagkatapos nang mawalan ng tubig, kaya walang oras mag-imbak.',
  ],
  'Water stays out for many hours or days': [
    'Counts outages that last half a day or longer, or that run for several days.',
    'Kasama rito ang pagkawala ng tubig na tumatagal ng kalahating araw o higit pa, o ilang araw.',
  ],
  'Low water pressure': [
    'Counts a weak trickle at the tap, a shower that barely runs, or water that cannot reach the second floor.',
    'Kasama rito ang mahinang agos sa gripo, shower na halos walang tubig, o tubig na hindi umaabot sa ikalawang palapag.',
  ],
  'Dirty, discolored, or foul-smelling water': [
    'Counts brown, yellow, or cloudy water, rust or sediment, or a chlorine or sewage smell.',
    'Kasama rito ang kayumanggi, madilaw, o malabong tubig, kalawang o latak, o amoy ng chlorine o imburnal.',
  ],
  'Leaking or broken water pipes are not repaired quickly': [
    'Counts burst or leaking pipes in the street or common areas that stay unfixed for days.',
    'Kasama rito ang pumutok o tumatagas na tubo sa kalye o karaniwang lugar na ilang araw nang hindi naaayos.',
  ],
  'No alternative water source during outages (tanker or refill)': [
    'Counts having no water tanker, refilling station, or shared tap to turn to when the supply is off.',
    'Kasama rito ang walang tanker, refilling station, o pampublikong gripo na mapagkukunan kapag walang suplay.',
  ],
  'Unclear who to contact or how to report a water problem': [
    'Counts not knowing which number, office, or person to call when the water has a problem.',
    'Kasama rito ang hindi pag-alam kung anong numero, opisina, o tao ang tatawagan kapag may problema sa tubig.',
  ],
  'No updates on when the water will return': [
    'Counts waiting with no word on when the supply will be restored.',
    'Kasama rito ang paghihintay nang walang balita kung kailan babalik ang tubig.',
  ],
  'Unfair or unclear water charges': [
    'Counts bills that look too high, charges you cannot explain, or being billed during an outage.',
    'Kasama rito ang bayaring mukhang masyadong mataas, singil na hindi maipaliwanag, o siningil kahit walang tubig.',
  ],

  // ---- Power ----
  'Frequent power interruptions': [
    'Counts the lights going out several times a week, even for just a few minutes.',
    'Kasama rito ang pagkawala ng kuryente nang ilang beses sa isang linggo, kahit ilang minuto lang.',
  ],
  'Power outages with no announcement': [
    'Counts blackouts with no notice of when, why, or how long they will last.',
    'Kasama rito ang brownout na walang abiso kung kailan, bakit, o gaano katagal.',
  ],
  'Hanging, exposed, or unsafe electrical wires': [
    'Counts low-hanging cables, bare wires, or tangled lines on posts that could shock someone or start a fire.',
    'Kasama rito ang mababang nakasabit na kable, hubad na kawad, o gusot na linya sa poste na maaaring makakuryente o magdulot ng sunog.',
  ],
  'Slow follow-up on reported power problems': [
    'Counts reports of outages or sparking lines that take days to get any response.',
    'Kasama rito ang mga report ng brownout o kumikislap na linya na ilang araw bago nasagot.',
  ],
  'Voltage drops or flickering lights': [
    'Counts lights that dim or flicker, or appliances that struggle to run when others are on.',
    'Kasama rito ang mga ilaw na lumalamlam o kumikislap, o appliance na nahihirapang tumakbo kapag may ibang nakabukas.',
  ],
  'Appliances damaged by power surges': [
    'Counts a TV, refrigerator, or aircon that broke after a sudden spike or when power came back.',
    'Kasama rito ang TV, ref, o aircon na nasira pagkatapos ng biglaang taas ng boltahe o nang bumalik ang kuryente.',
  ],
  'Electric posts that are leaning, damaged, or too close to houses': [
    'Counts tilted or cracked posts, or poles and transformers that sit very close to homes.',
    'Kasama rito ang nakatagilid o basag na poste, o poste at transformer na napakalapit sa mga bahay.',
  ],

  // ---- Garbage ----
  'Missed collection days': [
    'Counts the garbage truck skipping a scheduled day without coming at all.',
    'Kasama rito ang hindi pagdating ng trak ng basura sa takdang araw.',
  ],
  'Collection schedule is unclear': [
    'Counts not knowing which days or what time the truck passes your street.',
    'Kasama rito ang hindi pag-alam kung anong araw o oras dumaraan ang trak sa kalye ninyo.',
  ],
  'Garbage left uncollected for days': [
    'Counts bags piling up at the curb for several days after the usual pickup.',
    'Kasama rito ang mga supot na naiipon sa tabi ng kalsada nang ilang araw pagkatapos ng karaniwang kolekta.',
  ],
  'Improper waste segregation not enforced': [
    'Counts wet and dry waste, recyclables, or hazardous items mixed in one bin with no reminders.',
    'Kasama rito ang basurang basa at tuyo, nare-recycle, o delikado na magkakahalo sa iisang lalagyan at walang paalala.',
  ],
  'Foul odor or pests from garbage areas': [
    'Counts bad smells, flies, rats, or roaches around collection points or bins.',
    'Kasama rito ang masamang amoy, langaw, daga, o ipis sa paligid ng mga lugar ng koleksyon o basurahan.',
  ],
  'Garbage trucks come at inconvenient or noisy hours': [
    'Counts trucks that pass very early in the morning or late at night with loud engines or banging bins.',
    'Kasama rito ang trak na dumaraan nang napakaaga o napakagabi na maingay ang makina o kalampag ng basurahan.',
  ],
  'Not enough trash bins or collection points': [
    'Counts overflowing bins, or having no place nearby to put garbage out.',
    'Kasama rito ang umaapaw na basurahan, o walang malapit na mapaglalagyan ng basura.',
  ],

  // ---- Street lights ----
  'Lights not working': [
    'Counts street lights that are burnt out or never turn on.',
    'Kasama rito ang mga ilaw sa kalye na sunog na o hindi kailanman bumubukas.',
  ],
  'Areas that are too dark at night': [
    'Counts corners, alleys, or stretches with no light that feel unsafe to walk through.',
    'Kasama rito ang mga kanto, eskinita, o bahagi ng daan na walang ilaw at nakakatakot daanan.',
  ],
  'Repairs take too long': [
    'Counts broken lights that stay dark for weeks after being reported.',
    'Kasama rito ang sirang ilaw na ilang linggong madilim pagkatapos i-report.',
  ],
  'Lights stay on during the day': [
    'Counts street lights that burn in broad daylight and waste power.',
    'Kasama rito ang mga ilaw sa kalye na bukas kahit tanghaling tapat at nag-aaksaya ng kuryente.',
  ],
  'Flickering or dim lights': [
    'Counts lights that blink on and off, or give too little light to see by.',
    'Kasama rito ang mga ilaw na kumukurap, o masyadong maliit ang liwanag para makakita.',
  ],
  'Unclear who to report a broken light to': [
    'Counts not knowing whether to tell the HOA, the guard, or the power company.',
    'Kasama rito ang hindi pag-alam kung sasabihin ba sa HOA, sa guwardiya, o sa kumpanya ng kuryente.',
  ],
  'Lights are blocked by trees or poles': [
    'Counts branches or structures that cover the light and leave the street dark.',
    'Kasama rito ang mga sanga o istrukturang tumatakip sa ilaw kaya madilim ang kalye.',
  ],

  // ---- Roads and drainage ----
  'Potholes or damaged roads': [
    'Counts holes, cracks, or sunken sections that damage tires or cause accidents.',
    'Kasama rito ang mga butas, bitak, o lumubog na bahagi na sumisira sa gulong o nagdudulot ng aksidente.',
  ],
  'Flooding or poor drainage': [
    'Counts streets or yards that fill with water during ordinary rain.',
    'Kasama rito ang mga kalye o bakuran na binabaha kahit karaniwang ulan lang.',
  ],
  'Blocked or clogged drains': [
    'Counts canals or drains packed with trash, mud, or leaves that stop the water from flowing.',
    'Kasama rito ang mga kanal na barado ng basura, putik, o dahon kaya hindi umaagos ang tubig.',
  ],
  'Road repairs are slow or left unfinished': [
    'Counts patching or concreting that drags on for weeks, or is abandoned halfway.',
    'Kasama rito ang pagpapatag o pagkokongkreto na inaabot ng ilang linggo, o iniwang hindi tapos.',
  ],
  'Missing or faded road signs and markings': [
    'Counts missing speed-limit or stop signs, and worn lane or crossing paint.',
    'Kasama rito ang nawawalang karatula ng speed limit o stop, at kupas na marka ng linya o tawiran.',
  ],
  'Floodwater stays for hours after the rain': [
    'Counts water still standing in the street long after the rain has stopped.',
    'Kasama rito ang tubig na nakatigil pa rin sa kalye matagal nang tumigil ang ulan.',
  ],
  'Broken or uncovered drain covers': [
    'Counts open manholes or cracked covers that people or vehicles could fall into.',
    'Kasama rito ang bukas na manhole o basag na takip na maaaring mahulugan ng tao o sasakyan.',
  ],

  // ---- Noise and curfew ----
  'Loud parties or gatherings': [
    'Counts celebrations, drinking sessions, or gatherings that run past a reasonable hour with loud music or shouting.',
    'Kasama rito ang handaan, inuman, o salu-salo na lumalampas sa makatwirang oras na may malakas na musika o sigawan.',
  ],
  'Construction noise outside allowed hours': [
    'Counts hammering, drilling, or cement mixers running very early, late at night, or on Sundays.',
    'Kasama rito ang pagmamartilyo, pagbabarena, o paghahalo ng semento nang napakaaga, gabing-gabi, o tuwing Linggo.',
  ],
  'Curfew hours are unclear or unenforced': [
    'Counts not knowing the quiet hours, or rules that exist but nobody follows.',
    'Kasama rito ang hindi pag-alam sa oras ng katahimikan, o mga patakarang mayroon ngunit hindi sinusunod.',
  ],
  'Videoke or loud music at night': [
    'Counts karaoke or speakers that carry into your home after bedtime.',
    'Kasama rito ang videoke o speaker na umaabot sa bahay mo pagkatapos ng oras ng tulog.',
  ],
  'Loud vehicles or motorcycles passing at night': [
    'Counts revving, modified mufflers, or honking in the middle of the night.',
    'Kasama rito ang pag-arangkada, binagong tambutso, o pagbusina sa kalagitnaan ng gabi.',
  ],
  'Noise complaints are not acted on': [
    'Counts complaints made to the guard or HOA that get no response or follow-up.',
    'Kasama rito ang mga reklamong ipinaabot sa guwardiya o HOA na walang sagot o aksyon.',
  ],
  'Noise from home-based shops or nearby businesses': [
    'Counts machines, customers, deliveries, or music from a store or workshop nearby.',
    'Kasama rito ang makina, mamimili, delivery, o musika mula sa kalapit na tindahan o talyer.',
  ],

  // ---- Parking ----
  'Not enough visitor parking': [
    'Counts guests having nowhere to park, so they leave cars in the street.',
    'Kasama rito ang mga bisitang walang mapaparadahan kaya iniiwan ang sasakyan sa kalye.',
  ],
  'Vehicles blocking driveways or roads': [
    'Counts cars that block your gate or driveway, or narrow the road so others cannot pass.',
    'Kasama rito ang mga sasakyang humaharang sa gate o driveway mo, o nagpapaliit ng daan kaya hindi makadaan ang iba.',
  ],
  'Parking rules are unclear': [
    'Counts not knowing where parking is allowed, for how long, or who may park.',
    'Kasama rito ang hindi pag-alam kung saan puwedeng pumarada, gaano katagal, o sino ang puwede.',
  ],
  'Parking in front of other homes without permission': [
    'Counts cars left in front of your house by people who are not your guests.',
    'Kasama rito ang mga sasakyang iniwan sa harap ng bahay mo ng mga hindi mo bisita.',
  ],
  'Illegal parking near the gate or on corners': [
    'Counts vehicles parked at corners, near the entrance, or on the sidewalk that block the view or traffic.',
    'Kasama rito ang mga sasakyang nakaparada sa kanto, malapit sa pasukan, o sa bangketa na humaharang sa tanawin o daloy ng trapiko.',
  ],
  'Violators are not reminded or penalized': [
    'Counts repeat offenders who never get a warning, sticker, or fine.',
    'Kasama rito ang paulit-ulit na lumalabag na hindi nabibigyan ng babala, sticker, o multa.',
  ],
  'Large vehicles or trucks parked on the street for long periods': [
    'Counts trucks, vans, or tricycles left parked on the street for days.',
    'Kasama rito ang trak, van, o traysikel na ilang araw na nakaparada sa kalye.',
  ],

  // ---- Security ----
  'Guards not visible or not patrolling regularly': [
    'Counts rarely seeing guards on the streets, or no rounds at night.',
    'Kasama rito ang bihirang makakita ng guwardiya sa kalye, o walang ronda sa gabi.',
  ],
  'Slow response to concerns': [
    'Counts waiting a long time for a guard to respond to a call or report.',
    'Kasama rito ang matagal na paghihintay bago tumugon ang guwardiya sa tawag o report.',
  ],
  'Procedures are unclear': [
    'Counts not knowing how to register a visitor, report an incident, or ask for help.',
    'Kasama rito ang hindi pag-alam kung paano magrehistro ng bisita, mag-report ng insidente, o humingi ng tulong.',
  ],
  'Long queues or delays at the gate': [
    'Counts lines of vehicles waiting at the entrance during busy hours.',
    'Kasama rito ang mahabang pila ng sasakyan sa pasukan sa mga oras na matao.',
  ],
  'Guards are not alert or are away from their posts': [
    'Counts guards who are asleep, on their phones, or missing from the gate.',
    'Kasama rito ang mga guwardiyang tulog, nakatutok sa cellphone, o wala sa gate.',
  ],
  'Strangers or unregistered vehicles enter easily': [
    'Counts people or vehicles that get in without being asked who they are or whom they are visiting.',
    'Kasama rito ang mga taong o sasakyang nakapapasok nang hindi tinatanong kung sino sila o sino ang bibisitahin.',
  ],
  'Incidents or lost items are not followed up': [
    'Counts reports of theft, lost belongings, or disturbances that never get an update.',
    'Kasama rito ang mga report ng nakawan, nawalang gamit, o kaguluhan na hindi kailanman nasundan.',
  ],

  // ---- Billing ----
  'Unclear billing or charges': [
    'Counts statements with items you cannot understand, or fees nobody explained.',
    'Kasama rito ang mga statement na may hindi maintindihang item, o bayaring walang nagpaliwanag.',
  ],
  'Difficulty getting a receipt or statement': [
    'Counts paying but waiting a long time for proof, or having to ask several times.',
    'Kasama rito ang nagbayad ngunit matagal na naghihintay ng patunay, o ilang beses nang humingi.',
  ],
  'Disputes not resolved': [
    'Counts billing errors or objections you raised that are still unsettled.',
    'Kasama rito ang mali sa singil o pagtutol na ipinaabot mo na hindi pa rin naaayos.',
  ],
  'Dues increase without a clear explanation': [
    'Counts higher monthly dues with no announcement or reason given.',
    'Kasama rito ang pagtaas ng buwanang dues na walang anunsyo o dahilan.',
  ],
  'Payment channels are limited or inconvenient': [
    'Counts having to pay only in cash at the office, or having no GCash or bank option.',
    'Kasama rito ang kailangang magbayad nang cash lang sa opisina, o walang GCash o bank na opsyon.',
  ],
  'Payments are not recorded correctly': [
    'Counts paid dues that still show as unpaid, or wrong amounts on the record.',
    'Kasama rito ang bayad na dues na nakatala pa ring hindi bayad, o maling halaga sa talaan.',
  ],
  'Late fees or penalties are unclear': [
    'Counts surcharges or penalties whose rate and due dates you were never told.',
    'Kasama rito ang dagdag na singil o multa na hindi sinabi sa iyo ang halaga at petsa ng bayaran.',
  ],

  // ---- Renovation permits ----
  'Requirements are unclear': [
    'Counts not knowing which papers, plans, or deposits are needed before work can begin.',
    'Kasama rito ang hindi pag-alam kung anong papeles, plano, o deposito ang kailangan bago magsimula ang gawain.',
  ],
  'Approval takes too long': [
    'Counts waiting weeks for a permit while the project is on hold.',
    'Kasama rito ang ilang linggong paghihintay sa permit habang nakatigil ang proyekto.',
  ],
  'Difficulty reaching the engineer or office in charge': [
    'Counts unanswered calls or visits when you try to reach the person who approves permits.',
    'Kasama rito ang mga tawag o pagbisitang walang sagot kapag sinusubukan mong abutin ang nag-aapruba ng permit.',
  ],
  'Fees are unclear or unexpectedly high': [
    'Counts deposits or charges that were not explained, or that changed along the way.',
    'Kasama rito ang mga deposito o singil na hindi ipinaliwanag, o nagbago habang nasa proseso.',
  ],
  'Neighbors are not informed about the work': [
    'Counts construction starting next door with no notice about the schedule or noise.',
    'Kasama rito ang pagsisimula ng konstruksyon sa kalapit-bahay na walang abiso tungkol sa iskedyul o ingay.',
  ],
  'Workers and materials block the road': [
    'Counts sand, gravel, or tools piled in the street, or work trucks that block passage.',
    'Kasama rito ang buhangin, graba, o gamit na nakatambak sa kalye, o trak ng gawaan na humaharang sa daan.',
  ],
  'No follow-up or inspection after approval': [
    'Counts work that goes ahead with no check on whether it follows the permit.',
    'Kasama rito ang gawaing tuloy-tuloy na walang pagsusuri kung sumusunod ba sa permit.',
  ],

  // ---- Pets and animals ----
  'Stray animals': [
    'Counts loose dogs or cats roaming the streets with no owner nearby.',
    'Kasama rito ang mga asong o pusang gala sa kalye na walang may-ari sa paligid.',
  ],
  'Pets not kept leashed or contained': [
    "Counts neighbors' dogs that run loose outside their yard or off the leash.",
    'Kasama rito ang aso ng kapitbahay na pakalat-kalat sa labas ng bakuran o walang tali.',
  ],
  'Noise from animals': [
    'Counts barking dogs, crowing roosters, or howling at night that disturbs your sleep or rest.',
    'Kasama rito ang tahol ng aso, tilaok ng manok, o alulong sa gabi na nakakagambala sa tulog o pahinga mo.',
  ],
  'Pet waste left on streets or common areas': [
    'Counts droppings left on sidewalks, in front of gates, or on the court or playground.',
    'Kasama rito ang dumi na iniiwan sa bangketa, sa harap ng gate, o sa court o palaruan.',
  ],
  'Aggressive or biting animals': [
    'Counts dogs that chase, growl at, or bite people or other animals.',
    'Kasama rito ang mga asong humahabol, umuungol, o nangangagat ng tao o ibang hayop.',
  ],
  'Stray animals scatter garbage': [
    'Counts dogs or cats tearing bags open and spreading trash on the street.',
    'Kasama rito ang mga asong o pusang pinupunit ang supot at ikinakalat ang basura sa kalye.',
  ],
  'Pet rules are unclear or unenforced': [
    'Counts not knowing the rules on pets, or rules that are never followed up.',
    'Kasama rito ang hindi pag-alam sa mga patakaran sa alagang hayop, o mga patakarang hindi sinusundan.',
  ],

  // ---- Common areas ----
  'Clubhouse, court, or playground not well maintained': [
    'Counts broken lights, peeling paint, or worn equipment in the shared amenities.',
    'Kasama rito ang sirang ilaw, nagbabalat na pintura, o gasgas na kagamitan sa mga shared na pasilidad.',
  ],
  'Gate or perimeter fence damaged': [
    'Counts broken gates, holes in the fence, or sections that let people through.',
    'Kasama rito ang sirang gate, butas sa bakod, o bahaging nadadaanan ng tao.',
  ],
  'Overgrown grass or untrimmed trees in common areas': [
    'Counts tall grass, or branches hanging over the road, walkways, or wires.',
    'Kasama rito ang mataas na damo, o mga sangang nakalaylay sa kalsada, daanan, o kable.',
  ],
  'Facility reservation is difficult or unclear': [
    'Counts hard-to-follow steps, fees, or schedules when booking the clubhouse or court.',
    'Kasama rito ang mahirap sundang hakbang, bayarin, o iskedyul sa pagpapareserba ng clubhouse o court.',
  ],
  'Facilities are closed or hard to access': [
    'Counts locked amenities, limited hours, or no one around who holds the key.',
    'Kasama rito ang nakakandadong pasilidad, limitadong oras, o walang may hawak ng susi.',
  ],
  'Facilities are dirty or lack basic supplies': [
    'Counts unclean restrooms or spaces, or missing water, soap, or lights.',
    'Kasama rito ang maruming banyo o lugar, o kulang sa tubig, sabon, o ilaw.',
  ],
  'Playground or court equipment is unsafe': [
    'Counts rusty swings, loose hoops, or broken surfaces that could hurt a child.',
    'Kasama rito ang kinakalawang na duyan, maluwag na ring, o sirang sahig na maaaring makasakit ng bata.',
  ],

  // ---- Neighbor disputes ----
  'Boundary or fence disagreements': [
    'Counts arguments over where a lot line, wall, or fence should stand.',
    'Kasama rito ang pagtatalo kung saan dapat ang hangganan ng lote, pader, o bakod.',
  ],
  'Complaints are not mediated': [
    'Counts conflicts you reported that nobody stepped in to settle.',
    'Kasama rito ang mga alitang ini-report mo na walang namagitan para ayusin.',
  ],
  'Unclear process for filing a complaint': [
    'Counts not knowing where, how, or to whom to file a complaint.',
    'Kasama rito ang hindi pag-alam kung saan, paano, o kanino magsasampa ng reklamo.',
  ],
  'Walkways or shared spaces are obstructed': [
    'Counts items, plants, or vehicles placed on sidewalks or shared paths.',
    'Kasama rito ang mga gamit, halaman, o sasakyang nakalagay sa bangketa o shared na daanan.',
  ],
  'Harassment or rude behavior by neighbors': [
    'Counts shouting, threats, insults, or repeated unwelcome behavior.',
    'Kasama rito ang sigawan, pagbabanta, pang-iinsulto, o paulit-ulit na hindi kanais-nais na asal.',
  ],
  'Shared drainage or tree branches cause conflict': [
    "Counts water from a neighbor's roof or canal, or branches and roots crossing into your lot.",
    'Kasama rito ang tubig mula sa bubong o kanal ng kapitbahay, o mga sanga at ugat na pumapasok sa lote mo.',
  ],
  'Unclear who handles disputes in the HOA': [
    'Counts not knowing which officer or committee takes neighbor disputes.',
    'Kasama rito ang hindi pag-alam kung aling opisyal o komite ang humahawak ng alitan ng magkapitbahay.',
  ],
};

/** What each group covers, shown when the group is ticked. */
export const O1_CATEGORY_NOTES: Record<string, Pair> = {
  water_supply: [
    'Covers having water at all, its pressure and cleanliness, and how outages are handled.',
    'Sakop nito ang pagkakaroon ng tubig, ang lakas at linis nito, at kung paano hinaharap ang pagkawala ng suplay.',
  ],
  electricity_power: [
    'Covers outages, flickering, and unsafe wiring or posts.',
    'Sakop nito ang brownout, pagkislap ng ilaw, at mapanganib na kable o poste.',
  ],
  garbage_collection: [
    'Covers missed pickups, unclear schedules, and the mess or smell around garbage.',
    'Sakop nito ang hindi nakolektang basura, hindi malinaw na iskedyul, at dumi o amoy sa paligid ng basura.',
  ],
  street_lights: [
    'Covers broken, dim, or missing lights on the streets.',
    'Sakop nito ang sira, malamlam, o nawawalang ilaw sa kalye.',
  ],
  roads_drainage: [
    'Covers damaged roads, flooding, and blocked drains.',
    'Sakop nito ang sirang kalsada, baha, at baradong kanal.',
  ],
  noise_curfew: [
    'Covers parties, construction, vehicles, and other sounds that break quiet hours.',
    'Sakop nito ang handaan, konstruksyon, sasakyan, at iba pang ingay na sumisira sa oras ng katahimikan.',
  ],
  parking: [
    'Covers too little space, blocked driveways, and unclear parking rules.',
    'Sakop nito ang kakulangan ng espasyo, nakaharang na driveway, at hindi malinaw na patakaran sa parking.',
  ],
  security_patrol: [
    'Covers guards, gate procedures, and how safety concerns are handled.',
    'Sakop nito ang mga guwardiya, proseso sa gate, at kung paano hinaharap ang mga alalahanin sa seguridad.',
  ],
  billing_dues: [
    'Covers unclear charges, receipts, payment options, and disputes over dues.',
    'Sakop nito ang hindi malinaw na singil, resibo, paraan ng pagbabayad, at alitan tungkol sa dues.',
  ],
  renovation_permits: [
    'Covers permit requirements, approval time, fees, and the effects of nearby construction.',
    'Sakop nito ang requirement sa permit, tagal ng pag-apruba, bayarin, at epekto ng kalapit na konstruksyon.',
  ],
  pet_animal: [
    'Covers stray animals, noise, waste, and pets that are not kept under control.',
    'Sakop nito ang mga gala na hayop, ingay, dumi, at alagang hindi napipigilan.',
  ],
  facilities_amenities: [
    'Covers upkeep, safety, access, and booking of the clubhouse, courts, and common areas.',
    'Sakop nito ang pag-aalaga, kaligtasan, pagpasok, at pagpapareserba sa clubhouse, court, at karaniwang lugar.',
  ],
  neighbor_disputes: [
    'Covers disagreements with neighbors and how they get settled.',
    'Sakop nito ang pagtatalo ng magkapitbahay at kung paano ito naaayos.',
  ],
};

export const O1_NOTES_FIL: Record<string, string> = {};
for (const [en, fil] of [...Object.values(O1_ITEM_NOTES), ...Object.values(O1_CATEGORY_NOTES)]) {
  O1_NOTES_FIL[en] = fil;
}

export function o1ItemNote(item: string): string | undefined {
  return O1_ITEM_NOTES[item]?.[0];
}

export function o1CategoryNote(categoryId: string): string | undefined {
  return O1_CATEGORY_NOTES[categoryId]?.[0];
}
