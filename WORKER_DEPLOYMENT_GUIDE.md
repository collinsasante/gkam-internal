# Cloudflare Worker Deployment Guide

This guide will help you deploy the Airtable API proxy worker to reduce API calls by 80-95%.

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for you to authorize the CLI.

## Step 3: Install Worker Dependencies

```bash
cd worker
npm install
```

## Step 4: Configure Worker Secrets

Set your Airtable credentials as encrypted secrets:

```bash
# Set Airtable API Key
npx wrangler secret put AIRTABLE_API_KEY
# When prompted, paste your Airtable API key

# Set Airtable Base ID
npx wrangler secret put AIRTABLE_BASE_ID
# When prompted, paste your Airtable Base ID
```

Your credentials will be encrypted and stored securely in Cloudflare.

## Step 5: Deploy the Worker

```bash
npm run deploy
```

After deployment, you'll see output like:

```
Published gkam-airtable-proxy (1.23 sec)
  https://gkam-airtable-proxy.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for the frontend configuration.

## Step 6: Update Frontend Environment Variables

Update `frontend/.env` to use the worker:

```env
# Existing variables (keep these)
VITE_AIRTABLE_API_KEY=your_api_key_here
VITE_AIRTABLE_BASE_ID=your_base_id_here

# Add these new variables
VITE_USE_WORKER_PROXY=true
VITE_WORKER_URL=https://gkam-airtable-proxy.your-subdomain.workers.dev
```

Replace `https://gkam-airtable-proxy.your-subdomain.workers.dev` with your actual worker URL from Step 5.

## Step 7: Test the Worker

### Option A: Test in Development

```bash
# In the worker directory
npm run dev
```

This starts a local worker at `http://localhost:8787`. Update your frontend `.env` temporarily:

```env
VITE_USE_WORKER_PROXY=true
VITE_WORKER_URL=http://localhost:8787
```

### Option B: Test Production Deployment

Just start your frontend application with the production worker URL configured.

```bash
cd ../frontend
npm run dev
```

## Step 8: Monitor Performance

### View Live Logs

```bash
cd worker
npm run tail
```

You'll see:
- Cache HIT/MISS status
- Request timings
- Any errors

### Check Browser DevTools

In your browser's Network tab, check response headers:
- `X-Cache: HIT` - Served from cache (fast!)
- `X-Cache: MISS` - Fetched from Airtable (slower)

## Expected Results

After deployment, you should see:

✅ **80-95% reduction in Airtable API calls**
- Team Members: ~95% cache hit rate (changes rarely)
- Accounts: ~90% cache hit rate
- Tasks/Deals: ~70-80% cache hit rate (updates more frequently)

✅ **50-75% faster response times**
- Direct Airtable: 300-800ms
- Worker cached: 50-200ms

✅ **Cost savings**
- Cloudflare Workers: FREE for most usage (100k requests/day)
- Airtable API: Reduced from ~10,000/day to ~1,000/day

## Customizing Cache Duration

Edit `worker/src/index.ts` to adjust cache times:

```typescript
const TABLE_CACHE_OVERRIDES: Record<string, number> = {
  'Team Members': 600,    // 10 minutes - rarely changes
  'Account': 300,         // 5 minutes
  'Tasks': 120,           // 2 minutes - updates frequently
  'Deals': 120,           // 2 minutes - changes frequently
};
```

Redeploy after changes:

```bash
npm run deploy
```

## Troubleshooting

### Worker returns 403/404

Check that secrets are set:
```bash
npx wrangler secret list
```

Should show:
```
AIRTABLE_API_KEY
AIRTABLE_BASE_ID
```

### CORS errors in browser

The worker has CORS configured as `*`. If you need to restrict it:

Edit `worker/src/index.ts`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // Change this
  ...
};
```

### Cache not working

1. Check response headers for `X-Cache`
2. Verify GET requests (POST/PATCH/DELETE don't cache)
3. Check browser console for errors

### High API usage still

1. Monitor cache hit rate: `npm run tail`
2. Increase cache TTL for specific tables
3. Check for components making duplicate requests

## Rollback Plan

If you need to disable the worker:

```env
# frontend/.env
VITE_USE_WORKER_PROXY=false
# VITE_WORKER_URL=https://... (comment out)
```

The app will fall back to direct Airtable API calls.

## Production Checklist

Before going live:

- [ ] Worker deployed successfully
- [ ] Secrets configured (API key, Base ID)
- [ ] Frontend `.env` updated with worker URL
- [ ] Tested GET requests (list views)
- [ ] Tested POST requests (create records)
- [ ] Tested PATCH requests (update records)
- [ ] Tested DELETE requests (delete records)
- [ ] Monitored cache hit rate (should be >70%)
- [ ] Verified response times improved
- [ ] Checked error logs (should be minimal)

## Advanced: Custom Domain

To use a custom domain like `api.yourdomain.com`:

1. Add a route in `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

2. Add DNS record in Cloudflare:
- Type: AAAA
- Name: api
- Content: 100:: (Cloudflare's IPv6 placeholder)
- Proxy: Enabled (orange cloud)

3. Update frontend `.env`:
```env
VITE_WORKER_URL=https://api.yourdomain.com
```

4. Redeploy:
```bash
npm run deploy
```

## Support

If you encounter issues:

1. Check Cloudflare Workers dashboard for logs
2. Run `npm run tail` for real-time debugging
3. Verify environment variables are set correctly
4. Test with `curl` to isolate frontend vs backend issues

```bash
# Test worker directly
curl https://your-worker.workers.dev/api/Team%20Members
```

## Cost Estimate

**Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Paid: $5/month for 10 million requests

**Savings on Airtable:**
- Without caching: ~10,000 API calls/day
- With caching: ~1,000 API calls/day (90% reduction)
- At scale: $100s/month saved on Airtable API usage

**Total:** Likely FREE on Cloudflare's free tier while saving significantly on Airtable costs.
