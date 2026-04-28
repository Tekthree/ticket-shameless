import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Simply Shameless',
  description: 'Terms for attending Simply Shameless events, purchasing tickets, and using this website.',
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

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.dark, paddingTop: 120, paddingBottom: 120 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>

        <div style={{ marginBottom: 72 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 20 }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 7vw, 88px)', lineHeight: 0.88, color: C.text, textTransform: 'uppercase', margin: 0, marginBottom: 28 }}>Terms &<br />Conditions</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>Last updated April 2026. By attending our events or using this site you agree to these terms. We've written them like humans.</p>
        </div>

        <Section label="Events & entry">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>All ticket sales are final. We don't offer refunds unless we cancel the event. If we cancel, you'll hear from us directly with full details and refund options.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>Some events are 21+. Age is verified at the door. No exceptions. Bring valid ID.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>We reserve the right to refuse entry or remove anyone from an event. This isn't something we do lightly — but safety and the quality of the experience for everyone else comes first.</p>
        </Section>

        <Section label="Code of conduct">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>Shameless events are inclusive spaces. Harassment, discrimination, or threatening behavior of any kind — based on race, gender, sexuality, appearance, disability, or anything else — is grounds for immediate removal and a permanent ban.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>If something happens to you or you witness something, find any staff member. We take this seriously.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>Be present. Take care of each other. That's what this is for.</p>
        </Section>

        <Section label="Tickets & transfers">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>Tickets are transferable. If you can't make it, you can give or sell your ticket to someone else. We just ask that you don't profit beyond face value — scalping undermines access for the community.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>Lost or stolen tickets are the responsibility of the holder. Screenshots are fine at the door.</p>
        </Section>

        <Section label="Photography & video">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>We photograph our events. By attending, you acknowledge that you may be captured in photos or video used for promotional purposes.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>Professional photo or video production at our events requires prior written approval. Reach out before the event, not after.</p>
        </Section>

        <Section label="Merch & orders">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>All merch sales are final unless an item arrives damaged or incorrect. If that happens, email us with a photo and we'll sort it out.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>Shipping estimates are estimates. We're a small operation and things occasionally take longer than expected. We appreciate your patience.</p>
        </Section>

        <Section label="This website">
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: '0 0 16px' }}>This site is provided as-is. We do our best to keep information accurate and up to date, but event details — venue, lineup, start times — can change. Always check our social channels for last-minute updates.</p>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>All content on this site — photos, graphics, copy — belongs to Simply Shameless Productions unless credited otherwise. Don't lift it without asking.</p>
        </Section>

        <div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 16 }}>Questions</div>
          <p style={{ color: C.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>Email us at{' '}
            <a href="mailto:hello@simplyshameless.com" style={{ color: C.red, textDecoration: 'none', borderBottom: `1px solid ${C.red}` }}>hello@simplyshameless.com</a>
          </p>
        </div>

      </div>
    </div>
  )
}
