import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const updates = [
  {
    id: 'e656212b-eda1-423b-8bd3-e15bbd248b31',
    description: `Reverie Society is back at Monkey Loft with Wonder Twinz, Spaceotter, and Kobalt Severa bringing deep, tech, and underground house to Seattle's rooftop dance floor.

Lineup:
• Wonder Twinz
• Spaceotter
• Kobalt Severa

Reverie Society Sundays runs every Sunday 3–8 PM at Monkey Loft, 2915 1st Ave S, Seattle. Presented by Shameless Productions, Viva Recordings, and Uniting Souls.

Happy hour drinks and food available, including non-alcoholic options.

21+ | 3–8 PM`,
  },
  {
    id: '1c239c2c-647c-4acb-b199-da919614c126',
    description: `Deck'd Out opens its 2026 season with an all-vinyl night headlined by Shvili from NYC on the rooftop and Sky Rivers from LA on the loft stage. Thursday, June 18 at Monkey Loft — two stages, sunset views, and underground selectors from coast to coast.

Happy Birthday Levi Clark!

Rooftop Stage:
• Shvili (NYC)
• Levi Clark (Shameless)

Loft Stage:
• Sky Rivers (LA)
• Emily Song (Viva)

About Shvili: Originally from Tbilisi, Georgia, Shvili is a classically trained pianist turned vinyl selector. She came up in New York's underground scene during the pandemic, digging deep into records and developing a distinct, playful style. She's shared the stage with Francesco del Garda, Anthea, Liquid Earth, Tini, Velasco, Nicola Cruz, and Andrey Pushkarev, and has played Public Records, ReSolute, Un_Mute, Flash DC, ATV Records, Apollo Studios, and Jolene Sound Room.

About Sky Rivers: Sky Rivers started out in 1995 in acid house and the early LA rave scene, then played San Francisco from 2001–2006 under the name Boris Collage. After a South American tour and the loss of his parents in 2008 and 2009, he stepped away from DJing to focus on filmmaking. He never stopped collecting records or playing intimate sets. In late 2023 an invitation to play In Transit in LA brought him back, and he's been building from there ever since.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '7edf3815-ec44-4e34-b4e3-7a54d747315e',
    description: `For the 14th summer, Deck'd Out returns! Starting June 18, we'll be hosting at least 13 events every Thursday from 7–11 PM up until the closing party September 10. Plenty of time to catch that sunset while dancing with your friends and still get home at a decent hour.

This season pass gives you unlimited access all summer long plus skip-the-line entry. This year we're hosting one more date than last year but keeping the ticket prices the same. Call it a baker's dozen. Plus if the weather and venue allow us to do a soft opening or two, there's no extra charge for season pass holders. A surprise Shameless gift will be waiting for you on your first visit this summer.

Full summer lineup to be announced soon.

*Season passes are not transferable or refundable.`,
  },
  {
    id: '46d80f89-2a34-4875-b7f3-33cb15b866b5',
    description: `Underground rave at a secret location. Tek Jones, Levi Clark, Succubass, and Johnny Monsoon. 21+, 10 PM–4 AM. Location revealed to ticket holders.`,
  },
  {
    id: '6ac775b8-2599-4824-890e-db88e9f4f334',
    description: `Reverie Society celebrates the Summer Solstice with a special Sunday at Monkey Loft. This week features a Music Is 4 Lovers showcase headlined by Jimbo James from San Diego, Editor-in-Chief of the Music Is 4 Lovers blog and label, alongside Seattle favorites Jon Lee and Terry Jasinto. The day opens early with a 2 PM Yoga session led by Rosie, with live music by Ramiro (separate ticket, limited capacity).

Lineup:
• Jimbo James (Music Is 4 Lovers, San Diego)
• Jon Lee
• Terry Jasinto
• 2 PM Yoga with Rosie, music by Ramiro (separate ticket, limited capacity)

Reverie Society Sundays runs every Sunday 3–8 PM at Monkey Loft, 2915 1st Ave S, Seattle. Presented by Shameless Productions, Viva Recordings, and Uniting Souls.

Happy hour drinks and food available, including non-alcoholic options.

21+ | 3–8 PM (Yoga at 2 PM)`,
  },
  {
    id: '93dd13ba-e558-45a4-9dc4-7a3e58dacb6c',
    description: `Deck'd Out Pride Edition goes off on Thursday, June 25 at Monkey Loft. OHC, IDLE, and Shameless are bringing two stages of house and techno to the rooftop for Seattle Pride week.

Rooftop Stage:
• Viper Fengz
• Haus|Gasm b2b Alfonso Tan
• Onyx

Loft Stage:
• Kween Kaysh
• Brandon Keys
• YouRMom

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '775738c1-4d64-43bf-b3b9-9b7ba18c72ee',
    description: `Reverie Society celebrates Seattle Pride Weekend with a Sunday day party at Monkey Loft. Wear your rainbows and bring a friend — the 2-for-1 applies to presale and door entry alike.

Lineup:
• Jen Woolfe
• Trinitron
• Joy
• DJ Chi

Reverie Society Sundays runs every Sunday 3–8 PM at Monkey Loft, 2915 1st Ave S, Seattle. Presented by Shameless Productions, Viva Recordings, and Uniting Souls.

Happy hour drinks and food available, including non-alcoholic options.

21+ | 3–8 PM`,
  },
  {
    id: '00c02b89-cefa-4dec-bb85-cdb8775c11c9',
    description: `Deck'd Out #3 on Thursday, July 2 brings DJ Said from San Francisco to the rooftop stage, with a Costa Showcase filling the loft. OFF99 and Shameless Productions present.

Rooftop Stage:
• DJ Said (Fatsouls Records, High Level, SF)
• Alessandro Carrabba

Loft Stage:
Costa Showcase:
• Kholo b2b Vanni Language
• Veta Vitali b2b Jaogaz

About DJ Said: Originally from Lagos, Nigeria, Said has spent over a decade building his name through events, production, and selection. His sound is rooted in percussion-based deep house with a soulful East Coast meets West African sensibility. He founded Fatsouls Productions in 1999 and runs Fatsouls Records, established in 2007. fatsoulsrecords.com | https://ra.co/dj/djsaid

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '9cc736c2-3f81-4f36-8c74-0c0fad0c7581',
    description: `Deck'd Out #4 on Thursday, July 9 brings a headliner from France to the rooftop stage, presented by Give N Groove and Shameless Productions. The loft goes to MMBASSY Showcase.

Rooftop Stage:
• Headliner TBA (France)
• Parker Mills b2b Fouad Masoud

Loft Stage:
MMBASSY Showcase:
• BexFromChicago b2b SKA
• Harmony Soleil
• Jacki Why
• Tootsie

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: 'f34fbab5-e28f-4893-a712-13c21cb984cd',
    description: `Do you roll with muppets? Love brunching with beautiful weirdos?

The extended Shameless Fam is bringing their Disco Brunch magic to Pono Ranch on Saturday, July 11, 12–6 PM. Expect a full afternoon of sunshine, sparkle, and dance-floor joy.

Wear your bright colors, silly wigs, and sequins galore — this one's built for the fabulous.

Music: Nu disco, Boogie, Funk, Classic disco
Plus a live performance by Seattle's own Viper Fengz

DJs: Julie Herrera, Recess, Shaner, Thorson, Spaceotter, YourMom

Coffee, brunch cocktails, and brunch bites to keep you fueled while you dance.

Limited reduced-cover advance tickets available now. 2-for-1 entry before 1 PM.

Come early, stay late, and get brunchy with us.`,
  },
  {
    id: 'db50c858-8754-44ff-b181-cc289f2562f4',
    description: `Deck'd Out #5 on Thursday, July 16 brings Jason Peters from San Francisco to the rooftop stage, with a Best Butt Takeover filling the loft. Shameless Productions presents.

Rooftop Stage:
• Jason Peters (Roam Recordings, SF)
• Recess

Loft Stage:
Best Butt Takeover:
• Left Cheek
• Right Cheek
• Farin
• Westbound
• Bongos by Ammo

About Jason Peters: San Francisco DJ, producer, and label head at Roam Recordings. Peters has spent over 25 years developing a sound rooted in psychedelic, cosmic, Italo, and acid-tinged club music. His productions including "Satellites" and "In the Dark" have charted on Beatport, and his catalog goes back to Bay Area releases on Wicked Records and UK imprint Hooj Choons. His DJ sets pull from the same archive, blending cosmic disco and hypnotic, psychedelic textures with an approach shaped by decades behind the decks. A regular at Sunset Sound System, Public Works, Monarch, and The Great Northern in San Francisco. International credits include SundaySunday, CRSSD Festival, Block 9 at Glastonbury, Red Light Radio, Kater Blau, and Alfresco Festival.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '165342a3-f028-4c47-b3e3-eab6e5ef7576',
    description: `Deck'd Out #6 on Thursday, July 23 brings Sassmouth from Chicago's God Particle and Smartbar to the rooftop stage, with Nark representing Bottom Forty on the bill. Haus Catz takes over the loft. Shameless presents.

Rooftop Stage:
• Sassmouth (God Particle, CHI)
• Nark (Bottom Forty, Massive)

Loft Stage:
Haus Catz:
• Thorson
• Shaner
• Cherry White
• 16bit Villain

About Sassmouth: One of the more fascinating creatures our planet houses is the ever-elusive Sassmouth. She holds a residency at Smartbar's Planet Chicago night and As You Like It in San Francisco, and launched her god particle label in 2013. Her mixes cover the full spectrum, from deep techno to acid to house to experimental, and somehow it always sounds like her. Mind the abundant basslines, dazzling melodies, and the occasional orchestral left turn. Absolutely gobsmacking from start to finish.

Nark holds down the Bottom Forty night at Massive Club in Seattle.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: 'bd740bee-e91f-4646-b927-a4531d489524',
    description: `Deck'd Out #7 on Thursday, July 30 brings Mango & Ginger from Los Angeles to the rooftop stage. Sazon and Shameless Productions present. DJs in a Dive Bar take the loft.

Rooftop Stage:
• Mango & Ginger (LA) — Brazilian DJ duo KA and MATA
• La Mala Noche
• Papito Peace

Loft Stage:
DJs in a Dive Bar:
• good juju
• Beer Goblin
• kuzCO
• Whitcher

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: 'fe591e92-bc67-438e-97cf-50a8646e3fb4',
    description: `Deck'd Out #8 on Thursday, August 6 brings Garth from the legendary Wicked crew to the Monkey Loft rooftop. Innerflight and Shameless Productions present. Nightmoves Showcase fills the loft.

Rooftop Stage:
• Garth (Wicked, SF)
• Kadeejah Streets

Loft Stage:
Nightmoves Showcase:
• Waxwitch
• Repoman
• Perdi La Luz

About Garth: DJ Garth is a San Francisco house music institution. He's been a core member of the Wicked Sound System since 1991, when the crew brought UK sound system culture to SF and kicked off the city's acid house scene with renegade full moon beach parties. He held a ten-year residency at Come Unity and played 23 years with Wicked alongside Markie, Jeno, and Thomas. His sound runs through acid house, space disco, and psychedelic rock. He runs Grayhound Records, which has put out 50+ singles since 1998 with artists including DJ Harvey, Perry Farrell, and Ray Mang. His anthem "Twenty Minutes of Disco Glory" with ETI was named one of Muzik Magazine's best dance singles of '96. Wicked was the pioneering sound system at Burning Man in 1995. Still playing all-vinyl.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '19804214-6a1d-4994-a833-63e8dde62be1',
    description: `Deck'd Out #9 on Thursday, August 13 brings Gene Hunt from Chicago's TRAX Records to the Monkey Loft rooftop. Flammable and Shameless Productions present.

Rooftop Stage:
• Gene Hunt (TRAX, CHI) — mrgenehunt.com | https://ra.co/dj/genehunt
• Brian Lyons
• Dane Garfield

Loft Stage:
• Riz Rollins
• Wesley Holmes
• Julie Herrera

About Gene Hunt: Gene Hunt has been a fixture in Chicago house music since the early 80s. He came up alongside Ron Hardy and Frankie Knuckles, released his first EP "Living in the Land" on Traxx Records in 1987, and has been putting out music ever since on labels including Djax, Hybrid, Rush Hour, and Svek. His albums "In Sound" and "Seasoned" are Chicago house canon. He's played Smart Bar, the Music Box, Medusas, Dimensions Festival in Croatia, Field Maneuvers in Oxford, Glastonbury, Outside Lands, Coachella, and Boiler Room in both London and Chicago. Two-time winner of the NBC Chicago Music Award. His "Dance Track Volume One" hit number one on the UK dance album charts in 2011.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '39dbc25a-1e6d-4ebe-9492-a0880839822c',
    description: `Deck'd Out #10 on Thursday, August 20 marks Late Night Munchies' 11-year anniversary, with Cami Jones headlining the rooftop. LNM and Shameless Productions present.

Rooftop Stage:
• Cami Jones (Hot Creations, Toolroom, Ibiza)
• Leah York b2b Jaogaz
• Tony H

Loft Stage:
• I.S.H
• Kendoll
• Koister

About Cami Jones: Cami Jones is a DJ, producer, and vocalist based in Ibiza. Her sets sit at the intersection of deep house and techno, built around groove and emotion rather than genre lines. She holds a residency at Pikes Ibiza and has released on Hot Creations, Repopulate Mars, Kaluki, and HE.SHE.THEY. As both a producer and vocalist, she threads hypnotic textures and sensual toplines through her tracks in a way that's become distinctly hers. She also runs her own label, nooghty.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: 'ea951d84-6f47-4571-92c7-abb94114fdbe',
    description: `Deck'd Out #11 on Thursday, August 27 — Happy Birthday Nayiram! Global Bounce takes the rooftop, Selector Records takes the loft. Global Bounce and Shameless Productions present.

Rooftop Stage:
Global Bounce Showcase:
• Nayiram
• Nazo
• Exis
• Tichi

Loft Stage:
Selector Records Showcase:
• Sherman
• Sugar Pea
• Jenn Green
• Breakbeat Brigadier

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '6a883288-fe54-4d3e-9430-a658d5878f8a',
    description: `Deck'd Out #12 on Thursday, September 3 features a KEXP Showcase on the rooftop. Shameless presents.

Rooftop Stage:
KEXP Showcase:
• Riz Rollins
• KID HOPS
• Brit Hansen
• Supremen La Rock

Loft Stage:
• JAME$ERVIN (Birthday set!)
• Illson
• Almond Brown

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
  {
    id: '686adcf4-709e-46ed-a4cb-6a6fda2b0ca5',
    description: `Deck'd Out closes out its 2026 summer season on Thursday, September 10 with Saqib and Pezzner b2b open-to-close on the rooftop. Shameless presents.

Rooftop Stage:
• Saqib b2b Pezzner (open to close)

Loft Stage:
• Tek Jones
• Chris Tower
• Brit Jean

About Saqib: Saqib is a guitarist, producer, and dancefloor instigator based in Brooklyn. He started playing guitar and bass in heavy metal bands in Lahore, Pakistan as a teenager, then moved into electronic music production through Point Blank, School of Audio Engineering NYC, Dubspot, and Rutgers. Since 2013 he's put out releases on Abracadabra, Flying Circus, Sol Selectas, Maccabi House, and Kamai Music, and runs his own imprint Beats On Time. In 2021 he was named one of 1001 Tracklists' top 100 producers to watch. He's played Electric Zoo, Cityfox at The Brooklyn Mirage, Abracadabra in Miami and NYC, and Monkey Loft Seattle for an open-to-close set.

Deck'd Out is a weekly sunset rooftop party at Monkey Loft every Thursday this summer, 7–11 PM.
Season passes: https://www.eventbrite.com/e/deckd-out-2026-season-pass-tickets-1985685849830

21+ | 7–11 PM`,
  },
]

let passed = 0
let failed = 0

for (const { id, description } of updates) {
  try {
    await sql`UPDATE events SET description = ${description} WHERE id = ${id}`
    console.log(`✓ ${id.slice(0, 8)}...`)
    passed++
  } catch (err) {
    console.error(`✗ ${id.slice(0, 8)}... — ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${passed} updated, ${failed} failed`)
