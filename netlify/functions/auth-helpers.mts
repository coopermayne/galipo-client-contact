import * as jose from 'jose'

// Types for our JWT payload
export interface AuthPayload {
  role: 'attorney' | 'client'
  clientSlug?: string
  iat: number
  exp: number
}

// Default JWT secret - override with JWT_SECRET env var for production
const DEFAULT_JWT_SECRET = 'galipo-client-contact-jwt-secret-2026'

// Get JWT secret from environment (server-side only, no VITE_ prefix)
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET
  return new TextEncoder().encode(secret)
}

// Create a signed JWT token
export async function createToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getJwtSecret()

  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

// Verify and decode a JWT token
export async function verifyToken(token: string): Promise<AuthPayload> {
  const secret = getJwtSecret()

  const { payload } = await jose.jwtVerify(token, secret)

  return payload as AuthPayload
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

// CORS headers helper
export function corsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Standard error responses
export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

export function forbidden(message = 'Forbidden'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

// Middleware-style auth verification
// Returns the auth payload if valid, or a Response to return if invalid
export async function requireAuth(
  request: Request,
  options?: {
    allowedRoles?: Array<'attorney' | 'client'>
    requiredClientSlug?: string
  }
): Promise<AuthPayload | Response> {
  const authHeader = request.headers.get('Authorization')
  const token = extractToken(authHeader)

  if (!token) {
    return unauthorized('Missing authentication token')
  }

  try {
    const payload = await verifyToken(token)

    // Check role if specified
    if (options?.allowedRoles && !options.allowedRoles.includes(payload.role)) {
      return forbidden('Insufficient permissions')
    }

    // Check clientSlug if specified (for client-specific endpoints)
    if (options?.requiredClientSlug && payload.role === 'client') {
      if (payload.clientSlug !== options.requiredClientSlug) {
        return forbidden('Access denied to this client data')
      }
    }

    return payload
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return unauthorized('Token expired')
    }
    return unauthorized('Invalid token')
  }
}

// Client password prefixes - matches CLIENTS config in App.jsx
// Add new clients here when you add them to the frontend
const CLIENT_PASSWORD_PREFIXES: Record<string, string> = {
  'alvarado-pool': 'Pool',
}

// Validate passwords against environment variables
export function validatePassword(password: string, clientSlug?: string): { valid: boolean; role: 'attorney' | 'client' } | null {
  const attorneyPassword = process.env.ATTORNEY_PASSWORD
  const clientPasswordSuffix = process.env.CLIENT_PASSWORD_SUFFIX

  // Check attorney password first
  if (attorneyPassword && password === attorneyPassword) {
    return { valid: true, role: 'attorney' }
  }

  // Check client password (requires clientSlug)
  if (clientSlug && clientPasswordSuffix) {
    const expectedPrefix = CLIENT_PASSWORD_PREFIXES[clientSlug]

    if (expectedPrefix) {
      const expectedPassword = expectedPrefix + clientPasswordSuffix
      if (password === expectedPassword) {
        return { valid: true, role: 'client' }
      }
    }
  }

  return null
}
