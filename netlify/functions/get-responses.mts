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

  // Get clientSlug first (needed for auth check)
  const url = new URL(request.url)
  const clientSlug = url.searchParams.get('clientSlug')

  if (!clientSlug) {
    return new Response(JSON.stringify({ error: 'Missing clientSlug parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }

  // Verify authentication
  // Attorneys can access any client; clients can only access their own data
  const auth = await requireAuth(request, { requiredClientSlug: clientSlug })
  if (auth instanceof Response) {
    return auth // Return error response
  }

  try {
    const store = getStore('client-responses')
    const key = `responses-${clientSlug}`

    const data = await store.get(key, { type: 'json' })

    if (!data) {
      return new Response(JSON.stringify({ responses: null, updatedAt: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch responses' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }
}
