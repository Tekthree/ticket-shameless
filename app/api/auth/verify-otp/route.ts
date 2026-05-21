import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  const { phone, code, name } = await req.json()
  if (!phone || !code) return NextResponse.json({ error: 'Phone and code required' }, { status: 400 })

  const normalized = normalizePhone(phone)
  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  const otps = await db`
    SELECT * FROM otp_codes
    WHERE phone = ${normalized}
    AND code = ${code}
    AND used = FALSE
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (otps.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  await db`UPDATE otp_codes SET used = TRUE WHERE id = ${otps[0].id as string}`

  let users = await db`SELECT * FROM users WHERE phone = ${normalized} LIMIT 1`

  if (users.length === 0) {
    users = await db`
      INSERT INTO users (phone, name) VALUES (${normalized}, ${name ?? null}) RETURNING *
    `
  } else if (name && !users[0].name) {
    users = await db`
      UPDATE users SET name = ${name} WHERE id = ${users[0].id as string} RETURNING *
    `
  }

  const user = users[0]
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const sessions = await db`
    INSERT INTO user_sessions (user_id, expires_at)
    VALUES (${user.id as string}, ${expiresAt.toISOString()})
    RETURNING *
  `

  return NextResponse.json({
    token: sessions[0].token,
    user: { id: user.id, phone: user.phone, name: user.name },
  })
}
