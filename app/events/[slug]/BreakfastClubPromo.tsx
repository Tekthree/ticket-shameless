import Image from 'next/image'
import Link from 'next/link'
import { PICFLOW_URLS } from '@/app/gallery/gallery-data'
import type { Event, LineupArtist } from '@/lib/events'
import ArchiveMarquee from './ArchiveMarquee'
import BreakfastCountdown from './BreakfastCountdown'
import FlyerVideo from './FlyerVideo'
import styles from './breakfast-club.module.css'

export const BREAKFAST_CLUB_2027 = 'the-breakfast-club-new-years-day-2027-2027-01-01'
const media = '/breakfast-club-2027'
const portraits: Record<string, string> = {
  "Riz Rollins": "riz-and-rob",
  "Solana Solstice": "solana-solstice",
  "Maya Mem Saab": "maya-mem-saab",
  "Christine Michelle": "christine-michelle",
  "Aivilo": "aivilo",
  "Brit Jean": "brit-jean",
  "Levi Clark": "levi-clark",
  "Sloane Motion": "sloane-motion",
  "Mia Maya": "sloane-and-mia",
  "Just Beef": "just-beef",
  "LGSP": "lgsp",
  "Recess": "recess",
  "Nazo": "nazo",
  "Chaotic Noise Marching Corps": "chaotic-noise",
  "Tek Jones": "tek-jones",
  "Nayiram": "nayiram",
  "Duncfoo": "duncfoo",
  "Peach": "peach",
  "Kadeejah Streets": "kadeejah-streets",
  "Jen Woolfe": "jen-woolfe",
  "Jon Lee": "jon-lee",
  "Tony H": "tony-h",
  "Papito Peace": "papito-peace",
  "Moist Towelette": "moist-towelette"
}

const characterDimensions = {
  avocado: [427, 506],
  bear: [547, 720],
  breakfast: [491, 274],
  cat_with_plant: [974, 1070],
  just_up: [329, 333],
  spoon: [260, 343],
  still_up: [266, 258],
  top_plant: [525, 1113],
} as const

const stages = [
  { key: 'loft', name: 'The Loft', character: 'bear' },
  { key: 'rooftop', name: 'The Rooftop', character: 'cat_with_plant' },
  { key: 'gallery', name: 'The Gallery', character: 'avocado' },
] as const

const pastPhotos = [
  ['004_dj-turntables-crowd-hands-up', 'Hands in the air behind the Breakfast Club DJ booth'],
  ['trio_rooftop_disco_ball_decorations', 'Friends under disco balls on the Monkey Loft rooftop'],
  ['woman_gold_dress_heart_hands_headpiece_crowd', 'Dancer in gold making a heart with her hands'],
  ['trio_shameless_shirt_excited_balloons', 'Friends celebrating with balloons at Breakfast Club'],
  ['012_party-microphone-trumpet-player-costumes', 'Costumed performers with a microphone and trumpet'],
  ['woman_neon_green_wig_zebra_coat_rooftop', 'Guest in a neon green wig on the rooftop'],
] as const

const archivePhotos = pastPhotos.flatMap(([file, alt]) => {
  const src = PICFLOW_URLS.find(url => url.endsWith(`${file}.jpg`))
  return src ? [{ src, alt }] : []
})

const faq = [
  ['Which morning does it start?', 'Doors open at 4 AM on Friday, January 1, 2027, after midnight on New Year’s Eve. We dance until 4 PM that afternoon.'],
  ['Is it 21+?', 'Yes. Bring a valid photo ID.'],
  ['Where do I get tickets?', 'Use the Get tickets link on this page to buy through Eventbrite.'],
  ['Where do I find set times?', 'Check the Set times section here for the schedule on each stage.'],
]

function Character({ name }: { name: keyof typeof characterDimensions }) {
  const [width, height] = characterDimensions[name]
  return <Image className={styles.character} src={`${media}/characters/${name}.png`}
    width={width} height={height} sizes="(max-width: 640px) 120px, 260px" quality={95} alt="" />
}

function Ticker({ words, tone }: { words: string[]; tone?: 'pink' }) {
  const run = [...words, ...words, ...words]
  return <div className={styles.ticker} data-tone={tone} aria-hidden="true">
    {[0, 1].map(copy => <span key={copy}>{run.map((word, index) => <b key={index}>{word}</b>)}</span>)}
  </div>
}

function artistName(artist: LineupArtist) {
  return artist.name === 'Magickat' ? 'MagicKat' : artist.name
}

function ArtistCard({ artist }: { artist: LineupArtist }) {
  const localPortrait = portraits[artist.name]
  const eventPortrait = localPortrait ? `${media}/lineup/${localPortrait}.webp` : artist.image_url
  const image = artist.name === 'Rob Green'
    ? artist.dj_profile_image_url ?? eventPortrait
    : eventPortrait ?? artist.dj_profile_image_url
  const content = <>
    <div className={styles.portrait}>
      {image
        // Existing lineup images can come from any artist's website.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={image} alt="" loading="lazy" decoding="async" />
        : <Character name="avocado" />}
    </div>
    {/* Zero-width space lets the long name break between its two words. */}
    <span>{artistName(artist).replace('ThemCandescence', 'Them\u200bCandescence')}</span>
  </>
  return <li>{artist.dj_slug ? <Link href={`/djs/${artist.dj_slug}`} data-analytics-event="artist_profile_click" data-analytics-target={artist.dj_slug}>{content}</Link> : <div>{content}</div>}</li>
}

export default function BreakfastClubPromo({ event, lineup }: { event: Event; lineup: LineupArtist[] }) {
  // Roaming performers are saved once with stage "all" and appear under every stage.
  const groups = stages
    .filter(stage => lineup.some(artist => artist.stage === stage.key))
    .map(stage => ({ ...stage, artists: [...lineup.filter(artist => artist.stage === stage.key), ...lineup.filter(artist => artist.stage === 'all')] }))
  const otherArtists = lineup.filter(artist => artist.stage !== 'all' && !stages.some(stage => stage.key === artist.stage))
  const schedule = groups.map(stage => ({ ...stage, artists: stage.artists.filter(artist => artist.time_slot) }))
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Monkey Loft ${event.address ?? 'Seattle'}`)}`
  const names = lineup.map(artistName)
  const nameGroups = [0, 1, 2, 3].map(row => names.filter((_, index) => index % 4 === row))
  const nameRows = Array.from({ length: 12 }, (_, index) => {
    const group = nameGroups[index % nameGroups.length]
    const offset = Math.floor(index / nameGroups.length)
    return [...group.slice(offset), ...group.slice(0, offset)]
  })
  const venuePhoto = archivePhotos[1]

  return (
    <div className={styles.promo}>
      <header className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.masthead}>
            <p>Shameless presents</p>
            <p>Seattle, WA · 01.01.27</p>
          </div>
          <h1>The Breakfast <span className={styles.squiggle}>Club</span> <span className={styles.year}>2027</span></h1>
          <div className={styles.heroInner}>
            <div className={styles.flyer}><FlyerVideo /></div>
            <div className={styles.intro}>
              <p className={styles.tagline}><span>Still up?</span><span>Just up?</span></p>
              <div className={styles.details}>
                <p>New Year’s Day at Monkey Loft</p>
                <p><strong>4 AM → 4 PM</strong></p>
                <p>Friday, January 1, 2027 · 21+</p>
              </div>
              {event.payment_link && <a className={styles.ticket} href={event.payment_link} data-analytics-event="ticket_click" data-analytics-target="hero">Get tickets <span aria-hidden="true">↗</span></a>}
              <div className={styles.stickers}><Character name="just_up" /><Character name="still_up" /></div>
            </div>
          </div>
        </div>
      </header>

      <a className={styles.photoTeaser} href="#past-photos" aria-label="See photos from past Breakfast Club parties">
        {archivePhotos.map(({ src }) => (
          <span key={src}><Image src={src} alt="" fill sizes="(max-width: 600px) 25vw, 17vw" /></span>
        ))}
      </a>
      <Ticker words={['Still up?', 'Just up?', 'Jan 1', '4 AM to 4 PM', 'Monkey Loft']} />

      <nav className={styles.jump} aria-label="Breakfast Club sections">
        <div className={styles.wrap}>
          <a href="#lineup" data-analytics-event="festival_section_click" data-analytics-target="lineup"><Character name="bear" /><span>Lineup</span><i aria-hidden="true">↗</i></a>
          <a href="#set-times" data-analytics-event="festival_section_click" data-analytics-target="set-times"><Character name="spoon" /><span>Set times</span><i aria-hidden="true">↗</i></a>
          <a href="#past-photos" data-analytics-event="festival_section_click" data-analytics-target="past-photos"><Character name="avocado" /><span>Past photos</span><i aria-hidden="true">↗</i></a>
          <a href="#faq" data-analytics-event="festival_section_click" data-analytics-target="faq"><Character name="breakfast" /><span>FAQ</span><i aria-hidden="true">↗</i></a>
        </div>
      </nav>

      <div className={styles.facts}>
        <div className={styles.wrap}>
          <div className={styles.fact}><p>Party length</p><strong>12 hours</strong></div>
          <a className={styles.fact} href="#lineup"><p>{groups.length === 3 ? 'Three' : 'Two'} stages</p><strong>{lineup.length} artists</strong><i aria-hidden="true">↗</i></a>
          <a className={styles.venue} href={mapUrl} data-analytics-event="venue_directions_click">
            {venuePhoto && <span className={styles.venuePhoto}><Image src={venuePhoto.src} alt="" fill sizes="(max-width: 720px) 92vw, 760px" /></span>}
            <b className={styles.note}>Here!</b>
            <span className={styles.address}><span><strong>Monkey Loft</strong>{event.address ?? 'Seattle, WA'}</span><i aria-hidden="true">↗</i></span>
          </a>
          <Character name="cat_with_plant" />
        </div>
      </div>

      <div className={styles.lineupIntro}>
        <div className={styles.doors}>
          <div className={styles.wrap}>
            <p>Doors open in</p>
            <BreakfastCountdown />
            {event.payment_link && <a className={styles.ticket} href={event.payment_link} data-analytics-event="ticket_click" data-analytics-target="countdown">Get tickets <span aria-hidden="true">↗</span></a>}
          </div>
        </div>
        <div className={styles.names} id="lineup">
          <div className={styles.nameRows} aria-hidden="true">
            {nameRows.map((row, index) => <div key={index}>{[0, 1].map(copy => <span key={copy}>{row.map(name => <b key={name}>{name}</b>)}</span>)}</div>)}
          </div>
          <h2 id="lineup-heading"><span className={styles.squiggle}>Lineup</span></h2>
        </div>
      </div>

      <section className={styles.lineup} aria-labelledby="lineup-heading">
        <div className={styles.drip} aria-hidden="true" />
        <div className={styles.wrap}>
          <nav className={styles.stageLinks} aria-label="Jump to a stage">
            {groups.map(stage => (
              <a key={stage.key} href={`#${stage.key}`} data-room={stage.key} data-analytics-event="stage_select" data-analytics-target={stage.key}>
                <span>{stage.name} <span aria-hidden="true">↓</span></span>
                <Character name={stage.character} />
              </a>
            ))}
          </nav>
          {groups.map(stage => (
            <div key={stage.key} id={stage.key} className={styles.stage} data-stage={stage.key}>
              <h3>{stage.name}</h3>
              <ul className={styles.artists}>{stage.artists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</ul>
            </div>
          ))}
          {otherArtists.length > 0 && <ul className={styles.artists}>{otherArtists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}</ul>}
        </div>
      </section>

      <section className={styles.schedule} id="set-times" aria-labelledby="schedule-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHeading}><h2 id="schedule-heading">Set times</h2><Character name="spoon" /></div>
          <div className={styles.scheduleGrid}>
            {schedule.map(stage => (
              <div key={stage.key}>
                <span className={styles.calendar} aria-hidden="true"><small>Jan</small>01</span>
                <h3>{stage.name}</h3>
                {stage.artists.length > 0
                  ? <ul>{stage.artists.map(artist => <li key={artist.id}><strong>{artist.time_slot}</strong> {artistName(artist)}</li>)}</ul>
                  : <p>Coming soon</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.archive} id="past-photos" aria-labelledby="past-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHeading}><h2 id="past-heading">Last time on the dance floor</h2><Character name="breakfast" /></div>
        </div>
        <ArchiveMarquee photos={archivePhotos} />
        <div className={styles.wrap}>
          <Link className={styles.secondary} href="/gallery">More photos in the Shameless gallery →</Link>
        </div>
      </section>
      <Ticker tone="pink" words={['The Breakfast Club', 'New Year’s Day', 'Dance till 4 PM', 'Shameless']} />

      <section className={styles.faq} id="faq" aria-labelledby="faq-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHeading}><h2 id="faq-heading">Good to know</h2><Character name="top_plant" /></div>
          <details><summary>Where is Monkey Loft?</summary><p><a href={mapUrl} data-analytics-event="venue_directions_click">{event.address ?? 'Monkey Loft, Seattle'} ↗</a></p></details>
          {faq.filter(([question]) => event.payment_link || question !== 'Where do I get tickets?').map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
          <p className={styles.recording}>Photography, audio and video recording may take place at the event.</p>
          {event.payment_link && <a className={styles.ticket} href={event.payment_link} data-analytics-event="ticket_click" data-analytics-target="faq">Get tickets <span aria-hidden="true">↗</span></a>}
        </div>
      </section>

      {event.payment_link && <a className={styles.dateBar} href={event.payment_link} data-analytics-event="ticket_click" data-analytics-target="mobile_bar">
        <span><strong>01/01</strong><small>Fri, 4 AM<br />2027</small></span><b>Get tickets</b>
      </a>}
    </div>
  )
}
