import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Confirmed — Simply Shameless',
}

export default function ShopSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#1c1917', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, width: '100%', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,50,26,0.12)', border: '2px solid #c9321a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9321a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(40px,6vw,64px)', lineHeight: 0.9, color: '#f0ece6', textTransform: 'uppercase', marginBottom: 20 }}>
          Order<br />Confirmed
        </div>

        <p style={{ color: '#7a7068', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          Thanks for repping Shameless. You'll receive a confirmation email shortly with shipping details.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn-primary">Back to Merch</Link>
          <Link href="/events" className="btn-outline">See Events</Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .btn-primary {
          display: inline-block;
          background: #c9321a;
          color: #fff;
          text-decoration: none;
          font-family: var(--font-barlow), sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 32px;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #a82614; }
        .btn-outline {
          display: inline-block;
          background: transparent;
          color: #f0ece6;
          border: 1px solid rgba(255,255,255,0.1);
          text-decoration: none;
          font-family: var(--font-barlow), sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 28px;
          transition: border-color 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.3); }
      ` }} />
    </div>
  )
}
