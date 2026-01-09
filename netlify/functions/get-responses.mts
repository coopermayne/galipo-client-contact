import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

export default async (request: Request, context: Context) => {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    const url = new URL(request.url)
    const clientSlug = url.searchParams.get('clientSlug')

    if (!clientSlug) {
      return new Response(JSON.stringify({ error: 'Missing clientSlug parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const store = getStore('client-responses')
    const key = `responses-${clientSlug}`

    const data = await store.get(key, { type: 'json' })

    if (!data) {
      return new Response(JSON.stringify({ responses: null, updatedAt: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch responses' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
