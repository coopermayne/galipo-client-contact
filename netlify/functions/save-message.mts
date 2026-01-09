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
    const { clientSlug, questionId, role, text } = body

    if (!clientSlug || !questionId || !role || !text) {
      return new Response(JSON.stringify({ error: 'Missing required fields: clientSlug, questionId, role, text' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    }

    if (role !== 'client' && role !== 'attorney') {
      return new Response(JSON.stringify({ error: 'Role must be "client" or "attorney"' }), {
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

    // Ensure the role in the message matches the authenticated user's role
    if (auth.role !== role) {
      return new Response(JSON.stringify({ error: 'Role mismatch: cannot post as different role' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
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
      // No existing messages, use empty object
    }

    // Add the new message
    const newMessage: Message = {
      role,
      text,
      timestamp: new Date().toISOString(),
    }

    if (!messages[questionId]) {
      messages[questionId] = []
    }
    messages[questionId].push(newMessage)

    // Save updated messages
    await store.setJSON(key, messages)

    return new Response(JSON.stringify({ success: true, message: newMessage }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('Error saving message:', error)
    return new Response(JSON.stringify({ error: 'Failed to save message' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  }
}
