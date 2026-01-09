import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'
import { requireAuth, corsHeaders } from './auth-helpers.mts'

interface Message {
  role: 'client' | 'attorney'
  text: string
  timestamp: string
}

interface MessagesData {
  [questionId: string]: Message[]
}

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
    const { clientSlug, questionId, commentIndex } = body

    if (!clientSlug || !questionId || commentIndex === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields: clientSlug, questionId, commentIndex' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Verify authentication
    const auth = await requireAuth(request, { requiredClientSlug: clientSlug })
    if (auth instanceof Response) {
      return auth
    }

    const store = getStore('client-responses')
    const key = `messages-${clientSlug}`

    // Get existing messages
    let messages: MessagesData = {}
    try {
      const existingMessages = await store.get(key, { type: 'json' })
      if (existingMessages) {
        messages = existingMessages as MessagesData
      }
    } catch (e) {
      // No existing messages
      return new Response(JSON.stringify({ error: 'No comments found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Check if the question has comments
    if (!messages[questionId] || messages[questionId].length === 0) {
      return new Response(JSON.stringify({ error: 'No comments found for this question' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Check if index is valid
    if (commentIndex < 0 || commentIndex >= messages[questionId].length) {
      return new Response(JSON.stringify({ error: 'Invalid comment index' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    // Remove the comment at the given index
    messages[questionId].splice(commentIndex, 1)

    // If no more comments for this question, remove the key
    if (messages[questionId].length === 0) {
      delete messages[questionId]
    }

    // Save updated messages
    await store.setJSON(key, messages)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('Error resolving comment:', error)
    return new Response(JSON.stringify({ error: 'Failed to resolve comment' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }
}
