import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Simply Shameless',
  description: 'Get in touch with Simply Shameless for bookings, press, general inquiries, or photo removal requests.',
}

const C = {
  dark: '#1c1917',
  red: '#c9321a',
  text: '#f0ece6',
  muted: '#7a7068',
  border: 'rgba(240,236,230,0.08)',
}

function ContactCard({ label, description, email, subject }: { label: string; description: string; email: string; subject?: string }) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`

  return (
    <a href={href} className="contact-card">
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: C.text, textTransform: 'uppercase', marginBottom: 8 }}>{email}</div>
      <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{description}</div>
    </a>
  )
}

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.dark, paddingTop: 120, paddingBottom: 120 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>

        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 20 }}>Get in Touch</div>
          <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: 0.88, color: C.text, textTransform: 'uppercase', margin: 0, marginBottom: 28 }}>Contact</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>We're a small team. Use the right channel and you'll hear back faster.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 72 }}>
          <ContactCard
            label="General"
            email="hello@simplyshameless.com"
            description="General questions, feedback, or anything that doesn't fit the other categories."
            subject="Hello"
          />
          <ContactCard
            label="Bookings"
            email="bookings@simplyshameless.com"
            description="DJ bookings, venue partnerships, and event collaboration proposals. Include a bio, mix link, and your dates."
            subject="Booking Inquiry"
          />
          <ContactCard
            label="Press & Media"
            email="press@simplyshameless.com"
            description="Interview requests, editorial coverage, and media credentials for events."
            subject="Press Inquiry"
          />
          <ContactCard
            label="Photo Removal"
            email="privacy@simplyshameless.com"
            description="Want a photo removed from our gallery? Email us with the image link or description and we'll handle it within 48 hours."
            subject="Photo Removal Request"
          />
        </div>

        <div style={{ paddingTop: 48, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 20 }}>Find Us</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Instagram', href: 'https://www.instagram.com/shamelessseattle/' },
              { label: 'Facebook', href: 'https://www.facebook.com/shamelessinseattle/' },
              { label: 'SoundCloud', href: 'https://soundcloud.com/shamelessinseattle' },
              { label: 'Resident Advisor', href: 'https://ra.co/promoters/13758' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="social-link">{s.label} →</a>
            ))}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .contact-card {
          display: block;
          padding: 28px 32px;
          border: 1px solid rgba(240,236,230,0.08);
          text-decoration: none;
          background: #242019;
          transition: border-color 0.2s, background 0.2s;
        }
        .contact-card:hover {
          border-color: rgba(201,50,26,0.4);
          background: #2a2218;
        }
        .social-link {
          color: #7a7068;
          text-decoration: none;
          font-family: var(--font-barlow), sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(240,236,230,0.08);
          padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .social-link:hover {
          color: #f0ece6;
          border-color: rgba(240,236,230,0.3);
        }
        @media (max-width: 640px) {
          .contact-card { padding: 20px 20px; }
        }
      ` }} />
    </div>
  )
}
