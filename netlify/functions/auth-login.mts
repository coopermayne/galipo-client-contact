import type { Context } from '@netlify/functions'
import { createToken, validatePassword, corsHeaders } from './auth-helpers.mts'

export default async (request: Request, context: Context) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }

  try {
    const body = await request.json()
    const { password, clientSlug } = body as { password?: string; clientSlug?: string }

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Validate the password
    const result = validatePassword(password, clientSlug)

    if (!result) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Create JWT token
    const tokenPayload = result.role === 'client' && clientSlug
      ? { role: result.role as 'client', clientSlug }
      : { role: result.role as 'attorney' }

    const token = await createToken(tokenPayload)

    return new Response(JSON.stringify({
      success: true,
      token,
      role: result.role,
      clientSlug: result.role === 'client' ? clientSlug : undefined,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }
}
