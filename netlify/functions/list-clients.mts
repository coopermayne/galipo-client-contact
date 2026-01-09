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
    const store = getStore('client-responses')
    const indexKey = '_client-index'

    let index: Record<string, { updatedAt: string }> = {}

    try {
      const existingIndex = await store.get(indexKey, { type: 'json' })
      if (existingIndex) {
        index = existingIndex as Record<string, { updatedAt: string }>
      }
    } catch (e) {
      // Index doesn't exist yet
    }

    // Convert index to array format
    const clients = Object.entries(index).map(([slug, data]) => ({
      slug,
      updatedAt: data.updatedAt,
    }))

    return new Response(JSON.stringify({ clients }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error listing clients:', error)
    return new Response(JSON.stringify({ error: 'Failed to list clients' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
