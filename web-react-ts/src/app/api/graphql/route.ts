/**
 * GraphQL Proxy Route
 *
 * Dev: Proxies localhost:3000/api/graphql -> localhost:4001/graphql
 * Production: Frontend goes directly to backend (no proxy needed)
 *
 * This avoids CORS issues during development
 */

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_GRAPHQL_URL

  if (!backendUrl) {
    return new Response(
      JSON.stringify({
        errors: [{ message: 'Backend GraphQL URL not configured' }],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Get the request body
    const body = await request.json()

    // Forward to the real backend
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          authorization: request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('GraphQL proxy error:', error)
    return new Response(
      JSON.stringify({
        errors: [{ message: 'Failed to proxy GraphQL request' }],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
