import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'
import { requireAuth, corsHeaders } from './auth-helpers.mts'

export default async (request: Request, context: Context) => {
  // Handle CORS
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
    const { clientSlug, responses } = body

    if (!clientSlug) {
      return new Response(JSON.stringify({ error: 'Missing clientSlug' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Verify authentication - only clients can save their own responses
    // Attorneys can also save (for admin purposes)
    const auth = await requireAuth(request, { requiredClientSlug: clientSlug })
    if (auth instanceof Response) {
      return auth
    }

    const store = getStore('client-responses')
    const updatedAt = new Date().toISOString()

    // Save the responses
    const key = `responses-${clientSlug}`
    await store.setJSON(key, {
      responses,
      updatedAt,
      clientSlug,
    })

    // Update the index
    const indexKey = '_client-index'
    let index: Record<string, { updatedAt: string }> = {}

    try {
      const existingIndex = await store.get(indexKey, { type: 'json' })
      if (existingIndex) {
        index = existingIndex as Record<string, { updatedAt: string }>
      }
    } catch (e) {
      // Index doesn't exist yet, use empty object
    }

    index[clientSlug] = { updatedAt }
    await store.setJSON(indexKey, index)

    return new Response(JSON.stringify({ success: true, updatedAt }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('Error saving responses:', error)
    return new Response(JSON.stringify({ error: 'Failed to save responses' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }
}
