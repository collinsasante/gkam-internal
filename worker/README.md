# Airtable API Proxy - Cloudflare Worker

This Cloudflare Worker acts as a caching proxy between your frontend application and Airtable API, dramatically reducing API calls and costs.

## Features

- **Intelligent Caching**: Automatic caching of GET requests with configurable TTL
- **Table-Specific Cache**: Different cache durations based on data change frequency
- **Cache Invalidation**: Automatic cache clearing on write operations (POST/PATCH/DELETE)
- **CORS Support**: Full CORS headers for frontend integration
- **Cost Reduction**: Can reduce Airtable API calls by 80-95%
- **Performance**: Lightning-fast responses from Cloudflare's edge network

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Secrets

Set your Airtable credentials as Worker secrets:

```bash
# Set Airtable API Key
npx wrangler secret put AIRTABLE_API_KEY
# Paste your API key when prompted

# Set Airtable Base ID
npx wrangler secret put AIRTABLE_BASE_ID
# Paste your Base ID when prompted
```

### 3. Deploy to Cloudflare

```bash
npm run deploy
```

After deployment, you'll get a worker URL like: `https://gkam-airtable-proxy.your-account.workers.dev`

### 4. Update Frontend Configuration

Update your frontend `.env` file to use the worker URL:

```env
# frontend/.env
VITE_USE_WORKER_PROXY=true
VITE_WORKER_URL=https://gkam-airtable-proxy.your-account.workers.dev
```

## Development

Run the worker locally for testing:

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`

## Cache Configuration

### Default Cache TTL (Time To Live)

- **GET requests**: 5 minutes (300 seconds)
- **LIST requests**: 3 minutes (180 seconds)
- **Write operations**: No cache (immediate)

### Table-Specific Cache Overrides

Different tables have different cache durations based on how frequently they change:

```typescript
'Team Member': 600 seconds (10 minutes)  // Rarely changes
'Account': 300 seconds (5 minutes)
'Contact': 180 seconds (3 minutes)
'Tasks': 120 seconds (2 minutes)         // Updates frequently
'Deals': 120 seconds (2 minutes)         // Changes frequently
```

You can adjust these in `src/index.ts` in the `TABLE_CACHE_OVERRIDES` object.

## API Endpoints

The worker proxies all Airtable API calls with the same structure:

### Get All Records
```
GET /api/{tableName}
```

### Get Single Record
```
GET /api/{tableName}/{recordId}
```

### Create Record
```
POST /api/{tableName}
Body: { "fields": { ... } }
```

### Update Record
```
PATCH /api/{tableName}/{recordId}
Body: { "fields": { ... } }
```

### Delete Record
```
DELETE /api/{tableName}/{recordId}
```

## Monitoring

### View Live Logs

```bash
npm run tail
```

### Check Cache Performance

Response headers include cache status:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched from Airtable

## Performance Metrics

Expected improvements:
- **API Call Reduction**: 80-95% fewer calls to Airtable
- **Response Time**: 50-200ms (vs 300-800ms direct to Airtable)
- **Cost Savings**: Significant reduction in Airtable API usage
- **Reliability**: Cloudflare's 99.99% uptime SLA

## Advanced Configuration

### Enable KV Storage (Optional)

For longer-term caching beyond the edge cache:

1. Create a KV namespace:
```bash
npx wrangler kv:namespace create "AIRTABLE_CACHE"
```

2. Update `wrangler.toml` with the namespace ID

3. Uncomment KV binding in `wrangler.toml` and update `src/index.ts` to use KV

### Custom Cache Rules

Edit `src/index.ts` to customize:
- Cache durations per table
- Cache invalidation logic
- Request/response transformations

## Troubleshooting

### Worker not responding
- Check deployment status: `npx wrangler whoami`
- Verify secrets are set: `npx wrangler secret list`

### Cache not working
- Check response headers for `X-Cache` status
- Verify `CACHE_TTL` environment variable
- Check browser console for CORS errors

### High API usage
- Monitor cache hit rate via logs
- Adjust table-specific cache TTLs
- Consider implementing request deduplication

## Security

- API keys are stored as encrypted Worker secrets
- CORS is configured for your domain only (update in `src/index.ts`)
- No sensitive data is logged
- All requests are encrypted (HTTPS only)

## Cost Estimate

Cloudflare Workers Free Tier:
- 100,000 requests/day free
- After that: $0.50 per million requests

For most applications, this worker will operate entirely within the free tier while saving significant Airtable API costs.
