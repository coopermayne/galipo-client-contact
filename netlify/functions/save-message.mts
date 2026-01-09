import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    if (role !== 'client' && role !== 'attorney') {
      return new Response(JSON.stringify({ error: 'Role must be "client" or "attorney"' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error saving message:', error)
    return new Response(JSON.stringify({ error: 'Failed to save message' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
