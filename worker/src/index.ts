/**
 * Cloudflare Worker - Airtable API Proxy with Caching
 *
 * This worker acts as a proxy between your frontend and Airtable API,
 * implementing intelligent caching to reduce API calls and costs.
 */

interface Env {
  AIRTABLE_API_KEY: string;
  AIRTABLE_BASE_ID: string;
  CACHE_TTL: number;
  // AIRTABLE_CACHE: KVNamespace; // Optional KV storage
}

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

// Cache TTL configurations by endpoint type (in seconds)
const CACHE_CONFIG = {
  // Read operations - longer cache
  GET: 300, // 5 minutes
  LIST: 180, // 3 minutes

  // Write operations - invalidate cache
  POST: 0,
  PATCH: 0,
  DELETE: 0,
};

// Tables that change less frequently can have longer cache
const TABLE_CACHE_OVERRIDES: Record<string, number> = {
  'Team Member': 600,      // 10 minutes - team members change rarely
  'Account': 300,          // 5 minutes
  'Contact': 180,          // 3 minutes
  'Customer Contact': 180, // 3 minutes
  'Tasks': 120,            // 2 minutes - updates more frequently
  'Activities': 120,       // 2 minutes
  'Interactions': 180,     // 3 minutes
  'Discovery Call Records': 300, // 5 minutes
  'Deals': 120,            // 2 minutes - changes frequently
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // Extract table name from path: /api/tableName or /api/tableName/recordId
      const pathParts = url.pathname.split('/').filter(p => p);

      if (pathParts.length === 0 || pathParts[0] !== 'api') {
        return new Response('Invalid endpoint', { status: 404, headers: corsHeaders });
      }

      const tableName = pathParts[1];
      const recordId = pathParts[2];

      if (!tableName) {
        return new Response('Table name required', { status: 400, headers: corsHeaders });
      }

      // Build Airtable API URL
      let airtableUrl = `${AIRTABLE_API_BASE}/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

      if (recordId) {
        airtableUrl += `/${recordId}`;
      }

      // Append query parameters
      if (url.search) {
        airtableUrl += url.search;
      }

      // Determine cache key and TTL
      const cacheKey = new Request(airtableUrl, {
        method: request.method,
        headers: request.headers,
      });

      const cacheTTL = TABLE_CACHE_OVERRIDES[tableName] ||
                       (request.method === 'GET' ? CACHE_CONFIG.GET : CACHE_CONFIG.LIST);

      // Try to get from cache for GET requests
      if (request.method === 'GET' && cacheTTL > 0) {
        const cache = caches.default;
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log(`Cache HIT for ${tableName}`);
          const response = new Response(cachedResponse.body, cachedResponse);
          response.headers.set('X-Cache', 'HIT');
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
        console.log(`Cache MISS for ${tableName}`);
      }

      // Forward request to Airtable
      const airtableRequest = new Request(airtableUrl, {
        method: request.method,
        headers: {
          'Authorization': `Bearer ${env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      });

      const airtableResponse = await fetch(airtableRequest);

      // Clone response for caching
      const responseToCache = airtableResponse.clone();
      const responseToReturn = airtableResponse.clone();

      // Cache successful GET requests
      if (request.method === 'GET' && airtableResponse.ok && cacheTTL > 0) {
        const cache = caches.default;
        const cacheResponse = new Response(responseToCache.body, responseToCache);
        cacheResponse.headers.set('Cache-Control', `public, max-age=${cacheTTL}`);

        ctx.waitUntil(cache.put(cacheKey, cacheResponse));
      }

      // For write operations, invalidate related caches
      if (['POST', 'PATCH', 'DELETE'].includes(request.method) && airtableResponse.ok) {
        ctx.waitUntil(invalidateTableCache(tableName, env));
      }

      // Build response with CORS headers
      const response = new Response(responseToReturn.body, {
        status: airtableResponse.status,
        statusText: airtableResponse.statusText,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
        },
      });

      return response;

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

/**
 * Invalidate cache for a specific table
 * This is called after write operations to ensure fresh data
 */
async function invalidateTableCache(tableName: string, env: Env): Promise<void> {
  try {
    const cache = caches.default;
    const baseUrl = `${AIRTABLE_API_BASE}/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

    // Create cache keys for common queries
    const keysToDelete = [
      new Request(baseUrl),
      new Request(`${baseUrl}?`),
    ];

    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`Cache invalidated for table: ${tableName}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}
