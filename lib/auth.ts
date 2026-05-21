'use client'

import { useState, useEffect } from 'react'

export type AuthUser = { id: string; phone: string; name: string | null }

const TOKEN_KEY = 'ss_session_token'
const USER_KEY = 'ss_user'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function storeSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
    setToken(getStoredToken())
  }, [])

  function signIn(newToken: string, newUser: AuthUser) {
    storeSession(newToken, newUser)
    setToken(newToken)
    setUser(newUser)
  }

  function signOut() {
    clearSession()
    setToken(null)
    setUser(null)
  }

  return { user, token, signIn, signOut, isLoggedIn: !!token }
}
