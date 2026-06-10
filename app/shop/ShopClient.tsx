'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/db'

const C = {
  dark: '#1c1917',
  darkDeep: '#111110',
  darkCard: '#252220',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkText: '#f0ece6',
  darkMuted: '#7a7068',
  red: '#c9321a',
  redDeep: '#a82614',
  redMuted: 'rgba(201,50,26,0.12)',
}

function getProductImageUrl(product: Product): string {
  if (product.image_url) return product.image_url
  const name = product.name.toLowerCase()
  if (name.includes('chain') || name.includes('pendant') || name.includes('necklace')) return '/images/merch/shameless_chain.png'
  if (name.includes('black tee') || name.includes('tee - black') || name.includes('visor tee')) return '/images/merch/shameless_black_tee.png'
  if (name.includes('white tee') || name.includes('tee — white')) return '/images/merch/shameless_white_tee.jpg'
  if (name.includes('hoodie')) return '/images/merch/shameless_hoodie.jpg'
  if (name.includes('cap') || name.includes('hat')) return '/images/merch/shameless_cap.jpg'
  if (name.includes('slipmat')) return '/images/merch/shameless_slipmats.jpg'
  return ''
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  { id: '1', name: 'Shameless Visor Pendant Chain', description: 'Custom brushed steel circular pendant engraved with the official Shameless DJ visor design. Attached to a premium silver barrel ball chain. Limited run.', price: 45, image_url: '/images/merch/shameless_chain.png', category: 'Accessories', sizes: ['One Size'], stock: 100, is_published: true, stripe_price_id: null, created_at: '' },
  { id: '2', name: 'Shameless Visor Tee - Black', description: 'Heavyweight 100% cotton streetwear t-shirt in washed black. Features a screen-printed circular DJ visor graphic on the chest. Classic boxy fit.', price: 35, image_url: '/images/merch/shameless_black_tee.png', category: 'Tops', sizes: ['S', 'M', 'L', 'XL', '2XL'], stock: 75, is_published: true, stripe_price_id: null, created_at: '' },
]

type CartItem = Product & { selectedSize: string; qty: number }

// ── PRODUCT IMAGE PLACEHOLDER ─────────────────────────────────────────────────
function ProductImage({ product, height = 280 }: { product: Product; height?: number }) {
  const localImage = getProductImageUrl(product)
  if (localImage) {
    return (
      <div style={{ height, position: 'relative', width: '100%' }}>
        <Image src={localImage} alt={product.name} fill sizes="(max-width: 640px) 50vw, 300px" style={{ objectFit: 'cover' }} />
      </div>
    )
  }
  const angles = [30, 45, 15, 60, 20, 35]
  const angle = angles[parseInt(product.id) % angles.length]
  return (
    <div style={{ height, background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(${angle}deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent ${16 + parseInt(product.id) * 3}px)` }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.darkMuted, letterSpacing: '0.06em', marginBottom: 4 }}>product shot</div>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, color: 'rgba(122,112,104,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.category}</div>
      </div>
    </div>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.darkCard,
        border: `1px solid ${hover ? C.red : C.darkBorder}`,
        borderRadius: 'var(--ss-radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.2s, box-shadow 0.25s',
        transform: hover ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hover ? '0 12px 32px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <div style={{ transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)', transform: hover ? 'scale(1.04)' : 'scale(1)' }}>
          {product.image_url ? (
            <div style={{ height: 280, position: 'relative' }}>
              <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 50vw, 300px" style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <ProductImage product={product} />
          )}
        </div>
      </div>
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 18, color: C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 8 }}>{product.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 22, color: C.red }}>${product.price}</div>
          <div style={{ color: C.darkMuted, fontSize: 12 }}>
            {product.sizes && product.sizes.length > 1 && product.category !== 'Accessories' ? `${product.sizes.length} sizes` : product.sizes?.[0] ?? ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PRODUCT DRAWER ────────────────────────────────────────────────────────────
function ProductDrawer({ product, onClose, onAddToBag }: { product: Product | null; onClose: () => void; onAddToBag: (item: CartItem) => void }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setSelectedSize(null); setQty(1); setAdded(false) }, [product?.id])
  useEffect(() => { document.body.style.overflow = product ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [product])

  if (!product) return null

  const needsSize = (product.sizes?.length ?? 0) > 1
  const autoSize = product.sizes?.length === 1 ? product.sizes[0] : null
  const effectiveSize = selectedSize ?? autoSize
  const canAdd = !needsSize || !!effectiveSize
  const outOfStock = product.stock === 0

  const handleAddToBag = () => {
    if (!canAdd || outOfStock) return
    onAddToBag({ ...product, selectedSize: effectiveSize!, qty })
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  async function handleBuyNow() {
    if (!product || !canAdd || outOfStock) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, size: effectiveSize }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: C.dark, width: 460, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.darkBorder}` }} className="ss-drawer">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.darkBorder}`, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted }}>{product.category}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.darkText)}
            onMouseLeave={e => (e.currentTarget.style.color = C.darkMuted)}>×</button>
        </div>

        {/* Image */}
        {product.image_url ? (
          <div style={{ height: 300, position: 'relative' }}><Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 100vw, 600px" style={{ objectFit: 'cover' }} /></div>
        ) : (
          <ProductImage product={product} height={300} />
        )}

        {/* Details */}
        <div style={{ padding: '28px 24px', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(26px,5vw,40px)', lineHeight: 0.9, color: C.darkText, textTransform: 'uppercase', marginBottom: 12 }}>{product.name}</div>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 32, color: C.red, marginBottom: 20 }}>${product.price}</div>

          {product.description && (
            <p style={{ color: C.darkMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 20, margin: '0 0 20px' }}>{product.description}</p>
          )}

          {/* Size picker */}
          {needsSize && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, marginBottom: 10 }}>
                Size {selectedSize && <span style={{ color: C.darkText }}>— {selectedSize}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {product.sizes!.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} style={{
                    background: selectedSize === s ? C.red : 'transparent',
                    border: `1px solid ${selectedSize === s ? C.red : 'rgba(255,255,255,0.1)'}`,
                    color: selectedSize === s ? '#fff' : C.darkText,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-barlow), sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '10px 0',
                    borderRadius: 'var(--ss-radius-btn)',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (selectedSize !== s) { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red } }}
                    onMouseLeave={e => { if (selectedSize !== s) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.darkText } }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.darkMuted, marginBottom: 10 }}>Quantity</div>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.darkBorder}`, borderRadius: 'var(--ss-radius)', overflow: 'hidden', width: 'fit-content' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'transparent', border: 'none', color: C.darkText, cursor: 'pointer', width: 44, height: 44, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <div style={{ width: 52, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 20, color: C.darkText, borderLeft: `1px solid ${C.darkBorder}`, borderRight: `1px solid ${C.darkBorder}` }}>{qty}</div>
              <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ background: 'transparent', border: 'none', color: C.darkText, cursor: 'pointer', width: 44, height: 44, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleAddToBag} disabled={outOfStock || (!canAdd && needsSize)} style={{
              background: added ? '#1a7a3a' : C.red,
              color: '#fff',
              border: 'none',
              cursor: canAdd && !outOfStock ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '18px',
              borderRadius: 'var(--ss-radius-btn)',
              opacity: canAdd && !outOfStock ? 1 : 0.4,
              transition: 'background 0.3s, opacity 0.2s',
            }}>
              {added ? '✓ Added to Bag' : outOfStock ? 'Out of Stock' : !canAdd && needsSize ? 'Select a Size' : `Add to Bag — $${(product.price * qty).toFixed(2)}`}
            </button>
            <button onClick={handleBuyNow} disabled={loading || outOfStock || (!canAdd && needsSize)} style={{
              background: 'transparent',
              color: C.darkText,
              border: `1px solid ${C.darkBorder}`,
              cursor: canAdd && !outOfStock ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '16px',
              borderRadius: 'var(--ss-radius-btn)',
              opacity: canAdd && !outOfStock ? 1 : 0.4,
              transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.color = C.darkText }}
            >
              {loading ? 'Loading...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CART DRAWER ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onQtyChange }: {
  cart: CartItem[]; onClose: () => void; onRemove: (item: CartItem) => void; onQtyChange: (item: CartItem, qty: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.map(item => ({
            id: item.id,
            qty: item.qty,
            size: item.selectedSize,
          }))
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: C.dark, width: 420, height: '100%', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.darkBorder}` }} className="ss-drawer">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.darkBorder}`, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkText }}>
            Your Bag {cart.length > 0 && <span style={{ color: C.red }}>({cart.reduce((s, i) => s + i.qty, 0)})</span>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.darkText)}
            onMouseLeave={e => (e.currentTarget.style.color = C.darkMuted)}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 18 18" fill="none"><path d="M1 1h2.5l1.7 8.5h9l1.5-5.5H5" stroke={C.darkBorder} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="15.5" r="1.2" fill={C.darkBorder}/><circle cx="13" cy="15.5" r="1.2" fill={C.darkBorder}/></svg>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkMuted }}>Your bag is empty</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id + item.selectedSize} style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: `1px solid ${C.darkBorder}` }}>
                {getProductImageUrl(item) ? (
                  <div style={{ width: 72, height: 72, borderRadius: 'var(--ss-radius)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    <Image src={getProductImageUrl(item)} alt={item.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 72, height: 72, background: C.darkCard, borderRadius: 'var(--ss-radius)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.darkMuted, fontFamily: 'monospace' }}>img</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 17, color: C.darkText, textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>{item.name}</div>
                  {item.selectedSize !== 'One Size' && <div style={{ color: C.darkMuted, fontSize: 13, marginBottom: 8 }}>Size: {item.selectedSize}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.darkBorder}`, borderRadius: 'var(--ss-radius-btn)', overflow: 'hidden' }}>
                      <button onClick={() => onQtyChange(item, item.qty - 1)} disabled={loading} style={{ background: 'transparent', border: 'none', color: C.darkText, cursor: loading ? 'not-allowed' : 'pointer', width: 32, height: 32, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 15, color: C.darkText, borderLeft: `1px solid ${C.darkBorder}`, borderRight: `1px solid ${C.darkBorder}` }}>{item.qty}</div>
                      <button onClick={() => onQtyChange(item, item.qty + 1)} disabled={loading} style={{ background: 'transparent', border: 'none', color: C.darkText, cursor: loading ? 'not-allowed' : 'pointer', width: 32, height: 32, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 18, color: C.darkText }}>${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                </div>
                <button onClick={() => onRemove(item)} disabled={loading} style={{ background: 'transparent', border: 'none', color: C.darkMuted, cursor: loading ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', marginTop: 2, fontSize: 18, transition: 'color 0.15s' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.color = C.red }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.color = C.darkMuted }}>×</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '24px', borderTop: `1px solid ${C.darkBorder}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.darkMuted }}>Subtotal</div>
              <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 26, color: C.darkText }}>${total.toFixed(2)}</div>
            </div>
            <div style={{ color: C.darkMuted, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>Shipping calculated at checkout</div>
            <button onClick={handleCheckout} disabled={loading} style={{
              display: 'block',
              width: '100%',
              background: C.red,
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '18px',
              borderRadius: 'var(--ss-radius-btn)',
              textAlign: 'center',
              marginBottom: 8,
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s, opacity 0.2s',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.redDeep }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.red }}
            >
              {loading ? 'Processing...' : `Checkout — $${total.toFixed(2)}`}
            </button>
            <button onClick={onClose} disabled={loading} style={{ width: '100%', background: 'transparent', border: `1px solid ${C.darkBorder}`, borderRadius: 'var(--ss-radius-btn)', color: C.darkText, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = C.red }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.borderColor = C.darkBorder }}
            >Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function ShopClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const displayProducts = products.length > 0 ? products : PLACEHOLDER_PRODUCTS
  const cats = ['All', ...Array.from(new Set(displayProducts.map(p => p.category ?? 'Other')))]
  const filtered = filter === 'All' ? displayProducts : displayProducts.filter(p => p.category === filter)

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const key = item.id + item.selectedSize
      const existing = prev.find(i => i.id + i.selectedSize === key)
      if (existing) return prev.map(i => i.id + i.selectedSize === key ? { ...i, qty: i.qty + item.qty } : i)
      return [...prev, item]
    })
  }, [])

  const removeFromCart = useCallback((item: CartItem) => {
    setCart(prev => prev.filter(i => !(i.id === item.id && i.selectedSize === item.selectedSize)))
  }, [])

  const changeQty = useCallback((item: CartItem, qty: number) => {
    if (qty < 1) removeFromCart(item)
    else setCart(prev => prev.map(i => i.id === item.id && i.selectedSize === item.selectedSize ? { ...i, qty } : i))
  }, [removeFromCart])

  return (
    <div style={{ minHeight: '100vh', background: C.dark }}>

      {/* Hero */}
      <div style={{ paddingTop: 64, background: C.dark }}>
        <div style={{ padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 56px) 0', maxWidth: 1312, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.red, marginBottom: 12 }}>Official Store</div>
            <h1 style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(52px, 8vw, 100px)', lineHeight: 0.86, textTransform: 'uppercase', color: C.darkText, margin: 0 }}>
              Merch<br />
              <span style={{ WebkitTextStroke: `3px ${C.darkText}`, color: 'transparent', fontStyle: 'italic' }}>Drop</span>
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
            <p style={{ color: C.darkMuted, fontSize: 15, lineHeight: 1.7, maxWidth: 280, fontWeight: 300, margin: 0, textAlign: 'right' }}>
              Wear the culture. Designed in-house, printed to order. Limited runs.
            </p>
            {/* Cart button */}
            <button onClick={() => setCartOpen(true)} style={{
              background: 'transparent',
              border: `1px solid ${cartCount > 0 ? C.red : C.darkBorder}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 'var(--ss-radius-btn)',
              transition: 'border-color 0.2s',
              color: C.darkText,
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.red)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = cartCount > 0 ? C.red : C.darkBorder)}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M1 1h2.5l1.7 8.5h9l1.5-5.5H5" stroke={cartCount > 0 ? C.red : C.darkMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="15.5" r="1.2" fill={C.darkMuted}/><circle cx="13" cy="15.5" r="1.2" fill={C.darkMuted}/></svg>
              <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: cartCount > 0 ? C.red : C.darkMuted }}>
                Bag {cartCount > 0 ? `(${cartCount})` : ''}
              </span>
            </button>
          </div>
        </div>

        <div style={{ margin: '32px clamp(20px,4vw,56px) 0', maxWidth: 1312, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ height: 1, background: C.darkBorder }} />
        </div>
      </div>

      {/* Sticky filter bar */}
      <div style={{ position: 'sticky', top: 64, zIndex: 100, background: 'rgba(28,25,23,0.97)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.darkBorder}` }}>
        <div style={{ maxWidth: 1312, margin: '0 auto', padding: `0 clamp(20px, 4vw, 56px)`, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {cats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-barlow), sans-serif',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: filter === cat ? C.darkText : 'rgba(240,236,230,0.45)',
              padding: '16px 0',
              marginRight: 28,
              position: 'relative',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {cat}
              <span style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 2, background: C.red, transform: `scaleX(${filter === cat ? 1 : 0})`, transformOrigin: 'left', transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)' }} />
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: 20, borderLeft: `1px solid ${C.darkBorder}` }}>
            <span style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.darkMuted }}>{filtered.length} items</span>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div style={{ maxWidth: 1312, margin: '0 auto', padding: `40px clamp(20px, 4vw, 56px) 80px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--ss-card-gap)' }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />
          ))}
        </div>

        {/* Coming soon */}
        <div style={{ marginTop: 48, padding: 'clamp(28px, 4vw, 48px)', border: '1px dashed rgba(201,50,26,0.25)', borderRadius: 'var(--ss-radius)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-barlow), sans-serif', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)', color: C.darkText, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>New Drop Coming Soon</div>
          <div style={{ color: C.darkMuted, fontSize: 15, marginBottom: 20 }}>Sign up to get first access — usually sells out in hours.</div>
          <a href="/#signup" style={{
            display: 'inline-block',
            background: C.red,
            color: '#fff',
            textDecoration: 'none',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '14px 36px',
            borderRadius: 'var(--ss-radius-btn)',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.redDeep)}
            onMouseLeave={e => (e.currentTarget.style.background = C.red)}
          >Join the List</a>
        </div>
      </div>

      {/* Drawers */}
      <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToBag={item => { addToCart(item); setCartOpen(true) }} />
      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQtyChange={changeQty} />}

      <style dangerouslySetInnerHTML={{ __html: `
        .ss-drawer {
          animation: ss-slideLeft 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes ss-slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 480px) {
          .ss-drawer {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.07) !important;
            margin-top: 15%;
            border-radius: 16px 16px 0 0;
            animation: ss-slideUp 0.35s cubic-bezier(0.22,1,0.36,1);
          }
        }
        @keyframes ss-slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      ` }} />
    </div>
  )
}
