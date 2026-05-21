import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const normalized = normalizePhone(phone)
  if (normalized.length < 10) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  const db = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })

  await db`
    INSERT INTO otp_codes (phone, code, expires_at)
    VALUES (${normalized}, ${code}, ${expiresAt.toISOString()})
  `

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER

  if (twilioSid && twilioToken && twilioFrom) {
    const twilio = require('twilio')(twilioSid, twilioToken)
    await twilio.messages.create({
      body: `Your Simply Shameless code: ${code}. Valid for 10 minutes.`,
      from: twilioFrom,
      to: normalized.length === 10 ? `+1${normalized}` : `+${normalized}`,
    })
  } else {
    // Twilio not configured — log for dev testing
    console.log(`[DEV] OTP for ${normalized}: ${code}`)
  }

  return NextResponse.json({
    ok: true,
    // Only expose code in dev (no Twilio credentials set)
    ...(!twilioSid && { devCode: code }),
  })
}
