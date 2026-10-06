/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/event-social/route'
import { POST as refresh } from '@/app/api/revalidate/route'
import { getPublicEventSocial, getPublicEventComments } from '@/lib/event-social'
import { neon } from '@neondatabase/serverless'
import { revalidatePath, revalidateTag } from 'next/cache'
import { POST as postComment } from '@/app/api/comment/route'
import { POST as postRsvp } from '@/app/api/rsvp/route'
import { createComment, createRsvp } from '@/lib/db'

jest.mock('@/lib/event-social', () => ({ getPublicEventSocial: jest.fn(), getPublicEventComments: jest.fn() }))
jest.mock('@neondatabase/serverless', () => ({ neon: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }))
jest.mock('@/lib/db', () => ({ createComment: jest.fn(), createRsvp: jest.fn() }))

const query = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  ;(neon as jest.Mock).mockReturnValue(query)
  ;(getPublicEventSocial as jest.Mock).mockResolvedValue({ count: 7, rsvpCounts: { going: 2, maybe: 0, not_going: 0 } })
  ;(getPublicEventComments as jest.Mock).mockResolvedValue([])
  delete process.env.CACHE_REVALIDATION_SECRET
})

test('anonymous archive reads skip comments and private database queries', async () => {
  const response = await GET(new NextRequest('https://example.test/api/event-social?event_id=a&comments=0'))
  expect((await response.json()).likes).toEqual({ count: 7, liked: false })
  expect(getPublicEventSocial).toHaveBeenCalledWith('a')
  expect(getPublicEventComments).not.toHaveBeenCalled()
  expect(query).not.toHaveBeenCalled()
  expect(response.headers.get('cache-control')).toBe('private, no-store')
})

test('personal like state is queried separately for each visitor', async () => {
  query.mockResolvedValueOnce([{ user_id: 'one' }]).mockResolvedValueOnce([])
  for (const [token, liked] of [['one', true], ['two', false]] as const) {
    const response = await GET(new NextRequest('https://example.test/api/event-social?event_id=a', { headers: { 'x-session-token': token } }))
    expect((await response.json()).likes.liked).toBe(liked)
  }
  expect(query).toHaveBeenCalledTimes(2)
  expect(getPublicEventSocial).toHaveBeenNthCalledWith(1, 'a')
  expect(getPublicEventSocial).toHaveBeenNthCalledWith(2, 'a')
})

test('missing event does not read the database', async () => {
  expect((await GET(new NextRequest('https://example.test/api/event-social'))).status).toBe(400)
  expect(getPublicEventSocial).not.toHaveBeenCalled()
})

test('refresh fails closed without configuration or valid authorization', async () => {
  const request = () => new NextRequest('https://example.test/api/revalidate', { method: 'POST' })
  expect((await refresh(request())).status).toBe(503)
  process.env.CACHE_REVALIDATION_SECRET = 'test-secret'
  expect((await refresh(request())).status).toBe(401)
  expect(revalidatePath).not.toHaveBeenCalled()
  expect(revalidateTag).not.toHaveBeenCalled()
})

test('authorized refresh invalidates content and public social data', async () => {
  process.env.CACHE_REVALIDATION_SECRET = 'test-secret'
  const response = await refresh(new NextRequest('https://example.test/api/revalidate', { method: 'POST', headers: { authorization: 'Bearer test-secret' } }))
  expect(response.status).toBe(200)
  expect(revalidateTag).toHaveBeenCalledWith('event-social')
  expect(revalidatePath).toHaveBeenCalledWith('/events/[slug]', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/djs/[slug]', 'page')
})

test('successful comment and RSVP writes invalidate shared social data', async () => {
  ;(createComment as jest.Mock).mockResolvedValue({ id: 'comment' })
  ;(createRsvp as jest.Mock).mockResolvedValue({ id: 'rsvp' })
  for (const handler of [postComment, postRsvp]) {
    const response = await handler(new NextRequest('https://example.test/api/write', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_id: 'a', name: 'Visitor', message: 'Hello' }),
    }))
    expect(response.status).toBe(201)
  }
  expect(revalidateTag).toHaveBeenCalledTimes(2)
  expect(revalidateTag).toHaveBeenCalledWith('event-social')
})
