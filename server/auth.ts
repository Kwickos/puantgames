import { Router } from 'express'
import jwt from 'jsonwebtoken'
import type { DiscordUser } from '../shared/types.js'

const COOKIE_NAME = 'puantgames-token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

function env() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID ?? '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  }
}

interface JwtPayload {
  discordId: string
  username: string
  avatar: string | null
  globalName: string | null
}

export function signToken(user: DiscordUser): string {
  return jwt.sign(
    {
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      globalName: user.globalName,
    } satisfies JwtPayload,
    env().jwtSecret,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env().jwtSecret) as JwtPayload
  } catch {
    return null
  }
}

export function discordAvatarUrl(user: { discordId: string; avatar: string | null }): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128`
  }
  // Default Discord avatar based on user ID
  const index = (BigInt(user.discordId) >> 22n) % 6n
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

export const authRouter = Router()

// Redirect to Discord OAuth2
authRouter.get('/discord', (_req, res) => {
  const { clientId, clientUrl } = env()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${clientUrl}/api/auth/discord/callback`,
    response_type: 'code',
    scope: 'identify',
  })
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
})

// OAuth2 callback
authRouter.get('/discord/callback', async (req, res) => {
  const code = req.query.code as string | undefined
  const { clientId, clientSecret, clientUrl } = env()
  const redirectUri = `${clientUrl}/api/auth/discord/callback`

  if (!code) {
    res.redirect(`${clientUrl}/?error=no_code`)
    return
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[auth] Token exchange failed:', await tokenRes.text())
      res.redirect(`${clientUrl}/?error=token_exchange`)
      return
    }

    const tokenData = await tokenRes.json() as { access_token: string }

    // Fetch Discord user
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      console.error('[auth] User fetch failed:', await userRes.text())
      res.redirect(`${clientUrl}/?error=user_fetch`)
      return
    }

    const discordUser = await userRes.json() as {
      id: string
      username: string
      avatar: string | null
      global_name: string | null
    }

    const user: DiscordUser = {
      discordId: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      globalName: discordUser.global_name,
    }

    const token = signToken(user)

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    res.redirect(clientUrl)
  } catch (err) {
    console.error('[auth] OAuth error:', err)
    res.redirect(`${clientUrl}/?error=oauth_error`)
  }
})

// Get current user from cookie
authRouter.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    res.json({ user: null })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.clearCookie(COOKIE_NAME)
    res.json({ user: null })
    return
  }

  res.json({
    user: {
      discordId: payload.discordId,
      username: payload.username,
      avatar: payload.avatar,
      globalName: payload.globalName,
      avatarUrl: discordAvatarUrl(payload),
    },
  })
})

// Logout
authRouter.get('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})
