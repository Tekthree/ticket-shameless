import Image from 'next/image'
import Link from 'next/link'
import { PICFLOW_URLS } from '@/app/gallery/gallery-data'
import type { Event, LineupArtist } from '@/lib/events'
import FlyerVideo from './FlyerVideo'
import styles from './breakfast-club.module.css'

export const BREAKFAST_CLUB_2027 = 'the-breakfast-club-new-years-day-2027-2027-01-01'
const media = '/breakfast-club-2027'
const portraits: Record<string, string> = {
  Peach: 'peach',
  'Maya Mem Saab': 'maya-mem-saab',
  'Solana Solstice': 'solana-solstice',
}

const stages = [
  { key: 'loft', name: 'The Loft', character: 'bear' },
  { key: 'rooftop', name: 'The Rooftop', character: 'cat_with_plant' },
]

const pastPhotos = [
  ['trio_rooftop_disco_ball_decorations', 'Friends under disco balls on the Monkey Loft rooftop'],
  ['woman_gold_dress_heart_hands_headpiece_crowd', 'Dancer in gold making a heart with her hands'],
  ['trio_shameless_shirt_excited_balloons', 'Friends celebrating with balloons at Breakfast Club'],
  ['woman_neon_green_wig_zebra_coat_rooftop', 'Guest in a neon green wig on the rooftop'],
] as const

const faq = [
  ['Which morning does it start?', 'Doors open at 4 AM on Friday, January 1, 2027, after midnight on New Year’s Eve. We dance until 4 PM that afternoon.'],
  ['Is it 21+?', 'Yes. Bring a valid photo ID.'],
  ['Where do I get tickets?', 'Use the Get tickets link on this page to buy through Eventbrite.'],
  ['Where do I find set times?', 'Check the Set times section here for the Loft and Rooftop schedules.'],
]

function Character({ name }: { name: string }) {
  return <Image className={styles.character} src={`${media}/${name}.webp`} width={260} height={260} alt="" />
}

function ArtistCard({ artist }: { artist: LineupArtist }) {
  const localPortrait = portraits[artist.name]
  const image = localPortrait ? `${media}/${localPortrait}.webp` : artist.image_url ?? artist.dj_profile_image_url
  const name = artist.name === 'Magickat' ? 'MagicKat' : artist.name
  const content = <>
    <div className={styles.portrait}>
      {image
        // Existing lineup images can come from any artist's website.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={image} alt="" loading="lazy" decoding="async" />
        : <Character name="avocado" />}
    </div>
    <span>{name}</span>
  </>
  return <li>{artist.dj_slug ? <Link href={`/djs/${artist.dj_slug}`}>{content}</Link> : content}</li>
}

export default function BreakfastClubPromo({ event, lineup }: { event: Event; lineup: LineupArtist[] }) {
  const groups = stages.map(stage => ({ ...stage, artists: lineup.filter(artist => artist.stage === stage.key) }))
  const otherArtists = lineup.filter(artist => !stages.some(stage => stage.key === artist.stage))
  const schedule = groups.map(stage => ({ ...stage, artists: stage.artists.filter(artist => artist.time_slot) }))
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Monkey Loft ${event.address ?? 'Seattle'}`)}`

  return (
    <div className={styles.promo}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Shameless Presents · New Year’s Day 2027</p>
            <h1>The Breakfast <em>Club</em></h1>
            <p className={styles.tagline}>Still up or just up?</p>
            <p className={styles.details}><strong>Friday, January 1 · 4 AM–4 PM</strong><br />Monkey Loft, Seattle · 21+</p>
            <div className={styles.actions}>
              {event.payment_link && <a className={styles.ticket} href={event.payment_link}>Get tickets <span aria-hidden="true">↗</span></a>}
              <a className={styles.secondary} href="#lineup">See the lineup ↓</a>
            </div>
            <div className={styles.stickers}><Character name="still_up" /><Character name="just_up" /></div>
          </div>
          <div className={styles.flyer}>
            <FlyerVideo />
            <Character name="avocado" />
          </div>
        </div>
      </header>

      <nav className={styles.jump} aria-label="Breakfast Club sections">
        <a href="#lineup">Lineup</a><a href="#set-times">Set times</a><a href="#past-photos">Past photos</a><a href="#faq">FAQ</a>
      </nav>

      <section className={styles.lineup} id="lineup" aria-labelledby="lineup-heading">
        <div className={styles.wrap}>
          <h2 id="lineup-heading">The lineup</h2>
          {groups.map(stage => (
            <div key={stage.key} className={styles.stage} data-stage={stage.key}>
              <div className={styles.stageHeading}>
                <h3>{stage.name}</h3><Character name={stage.character} />
              </div>
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
                <h3>{stage.name}</h3>
                {stage.artists.length > 0
                  ? <ul>{stage.artists.map(artist => <li key={artist.id}><strong>{artist.time_slot}</strong> {artist.name}</li>)}</ul>
                  : <p>Set times will be posted here once announced.</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.archive} id="past-photos" aria-labelledby="past-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHeading}><h2 id="past-heading">From the archives</h2><Character name="breakfast" /></div>
          <div className={styles.photos}>
            {pastPhotos.map(([file, alt]) => {
              const src = PICFLOW_URLS.find(url => url.endsWith(`${file}.jpg`))
              return src && <a key={file} href={src}><Image src={src} alt={alt} fill sizes="(max-width: 560px) 50vw, 25vw" /></a>
            })}
          </div>
          <Link className={styles.secondary} href="/gallery">More photos in the Shameless gallery →</Link>
        </div>
      </section>

      <section className={styles.faq} id="faq" aria-labelledby="faq-heading">
        <div className={styles.wrap}>
          <div className={styles.sectionHeading}><h2 id="faq-heading">Good to know</h2><Character name="top_plant" /></div>
          <details><summary>Where is Monkey Loft?</summary><p><a href={mapUrl}>{event.address ?? 'Monkey Loft, Seattle'} ↗</a></p></details>
          {faq.filter(([question]) => event.payment_link || question !== 'Where do I get tickets?').map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
          <p className={styles.recording}>Photography, audio and video recording may take place at the event.</p>
          {event.payment_link && <a className={styles.ticket} href={event.payment_link}>Get tickets <span aria-hidden="true">↗</span></a>}
        </div>
      </section>
    </div>
  )
}
