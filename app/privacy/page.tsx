import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Simply Shameless',
  description: 'How Simply Shameless handles your data, event photos, and contact information.',
}

const C = {
  dark: '#1c1917',
  red: '#c9321a',
  text: '#f0ece6',
  muted: '#7a7068',
  border: 'rgba(240,236,230,0.08)',
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 56, paddingBottom: 56, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 16 }}>{label}</div>
      {children}
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.dark, paddingTop: 120, paddingBottom: 120 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>

        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 20 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: 0.88, color: C.text, textTransform: 'uppercase', margin: 0, marginBottom: 28 }}>Privacy<br />Policy</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>Last updated April 2026. Short version: we collect the minimum, we don't sell anything, and your photos are yours.</p>
        </div>

        <Section label="What we collect">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>When you sign up for our newsletter, we collect your email address. That's it. No name required, no profile built, no tracking pixel.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>If you purchase merch, our payment processor (Stripe) handles your card and billing details. We receive only what's needed to fulfill your order — name and shipping address. We don't store card numbers.</p>
        </Section>

        <Section label="How we use it">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>Your email is used to send event announcements and occasional updates about Shameless. We send infrequently — only when something's actually happening.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>We don't sell, rent, or share your information with third parties for marketing. We don't run ads. We're not in that business.</p>
        </Section>

        <Section label="Event photos">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>Our events are photographed. By attending a Shameless event, you acknowledge that photos and video may be taken and used for promotional purposes — on this site, social media, and press coverage.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>If you appear in a photo and want it removed, we'll handle it within 48 hours, no questions asked. Use the removal form in our{' '}
            <Link href="/gallery" style={{ color: C.red, textDecoration: 'none', borderBottom: `1px solid ${C.red}` }}>gallery</Link>
            {' '}or email us directly.
          </p>
        </Section>

        <Section label="Cookies & tracking">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>This site uses minimal cookies — only what's necessary to keep the site functional (session handling, Stripe checkout). No ad tracking, no third-party analytics cookies, no fingerprinting.</p>
        </Section>

        <Section label="Your rights">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>You can unsubscribe from our newsletter at any time via the link in any email. You can request deletion of any personal data we hold by emailing us. We'll confirm within a week.</p>
        </Section>

        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 16 }}>Questions</div>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 24px' }}>Reach us at{' '}
            <a href="mailto:privacy@simplyshameless.com" style={{ color: C.red, textDecoration: 'none', borderBottom: `1px solid ${C.red}` }}>privacy@simplyshameless.com</a>
          </p>
          <Link href="/contact" style={{ color: C.muted, textDecoration: 'none', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>Contact Us →</Link>
        </div>

      </div>
    </div>
  )
}
