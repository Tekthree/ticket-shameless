'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/db'

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  { id: '1', name: 'Shameless Tee — Black', description: 'Classic fit, heavyweight cotton. Screen printed logo on chest.', price: 35, image_url: null, category: 'apparel', sizes: ['S', 'M', 'L', 'XL', 'XXL'], stock: 50, is_published: true, stripe_price_id: null, created_at: '' },
  { id: '2', name: 'Shameless Hoodie', description: 'Pullover hoodie, 80% cotton 20% poly. Embroidered logo.', price: 75, image_url: null, category: 'apparel', sizes: ['S', 'M', 'L', 'XL'], stock: 30, is_published: true, stripe_price_id: null, created_at: '' },
  { id: '3', name: 'Dad Hat — Washed Black', description: 'Unstructured 6-panel cap, adjustable strap.', price: 32, image_url: null, category: 'accessories', sizes: ['One Size'], stock: 40, is_published: true, stripe_price_id: null, created_at: '' },
  { id: '4', name: 'Sticker Pack (5)', description: 'Five die-cut vinyl stickers. Waterproof.', price: 10, image_url: null, category: 'accessories', sizes: null, stock: 200, is_published: true, stripe_price_id: null, created_at: '' },
]

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const [ref, visible] = useInView()
  const [hover, setHover] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length === 1 ? product.sizes[0] : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasSizes = product.sizes && product.sizes.length > 1
  const outOfStock = product.stock === 0

  async function handleBuy() {
    if (hasSizes && !selectedSize) {
      setError('Please select a size')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, size: selectedSize }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#1a1714',
          border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
          transition: 'border-color 0.2s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Image */}
        <div style={{ aspectRatio: '1/1', background: '#252220', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              style={{ objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)', transform: hover ? 'scale(1.04)' : 'scale(1)' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 16px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a5450', letterSpacing: '0.06em' }}>photo soon</span>
            </div>
          )}
          {outOfStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,16,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7a7068' }}>Sold Out</span>
            </div>
          )}
          {product.category && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(17,17,16,0.85)', backdropFilter: 'blur(8px)', color: '#7a7068', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '4px 10px' }}>
              {product.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 18, color: '#f0ece6', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 8 }}>{product.name}</div>
          {product.description && (
            <div style={{ color: '#7a7068', fontSize: 13, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{product.description}</div>
          )}

          {/* Size selector */}
          {hasSizes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5a5450', marginBottom: 8 }}>Size</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.sizes!.map(size => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setError(null) }}
                    style={{
                      padding: '6px 12px',
                      background: selectedSize === size ? '#c9321a' : 'transparent',
                      border: `1px solid ${selectedSize === size ? '#c9321a' : 'rgba(255,255,255,0.12)'}`,
                      color: selectedSize === size ? '#fff' : '#7a7068',
                      fontFamily: 'var(--font-barlow), sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >{size}</button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: '#c9321a', fontSize: 12, fontFamily: 'var(--font-dm), sans-serif', marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 24, color: '#f0ece6' }}>${product.price}</div>
            <button
              onClick={handleBuy}
              disabled={outOfStock || loading}
              style={{
                background: outOfStock ? 'rgba(255,255,255,0.04)' : (loading ? '#7a3020' : '#c9321a'),
                color: outOfStock ? '#5a5450' : '#fff',
                border: 'none',
                cursor: outOfStock || loading ? 'default' : 'pointer',
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!outOfStock && !loading) e.currentTarget.style.background = '#a82614' }}
              onMouseLeave={e => { if (!outOfStock && !loading) e.currentTarget.style.background = '#c9321a' }}
            >
              {loading ? 'Loading…' : outOfStock ? 'Sold Out' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ShopClient({ products }: { products: Product[] }) {
  const [headerRef, headerVisible] = useInView()
  const displayProducts = products.length > 0 ? products : PLACEHOLDER_PRODUCTS

  return (
    <div style={{ minHeight: '100vh', background: '#1c1917', paddingTop: 64 }}>
      <div className="shop-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 48px 100px' }}>
        {/* Header */}
        <div
          ref={headerRef}
          style={{
            marginBottom: 64,
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c9321a', marginBottom: 14 }}>Simply Shameless</div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.88, color: '#f0ece6', textTransform: 'uppercase', marginBottom: 24 }}>Merch</div>
          <p style={{ color: '#7a7068', fontSize: 16, lineHeight: 1.7, maxWidth: 480 }}>
            Represent Seattle's underground. All items ship within 5–7 business days.
          </p>
        </div>

        {/* Grid */}
        {displayProducts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 22, color: '#7a7068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No merch available yet</div>
            <div style={{ color: '#7a7068', fontSize: 14, marginTop: 12 }}>Check back soon.</div>
          </div>
        ) : (
          <div className="shop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {displayProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 60} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .shop-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .shop-container { padding: 40px 24px 80px !important; }
          .shop-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .shop-container { padding: 32px 16px 64px !important; }
          .shop-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
