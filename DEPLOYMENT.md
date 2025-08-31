# Deployment Guide & Best Practices

## Issue Resolution: KV Namespace Binding

The app was crashing because the KV namespace binding wasn't properly deployed to Cloudflare Workers, even though it was configured locally in `wrangler.toml`.

### What Happened
- The local `wrangler.toml` had the correct KV namespace configuration
- The Cloudflare Worker runtime didn't have access to the KV namespace binding
- This caused crashes when users tried to save notes (the `env.NOTES` was undefined)

### Solution
Running `npx wrangler deploy` synced the local configuration to Cloudflare, establishing the KV namespace binding.

## Deployment Workflow Best Practices

### Recommended Development & Deployment Flow

```
Local Development → Test → Deploy to Cloudflare → Verify → Push to GitHub
```

1. **Local Development**
   ```bash
   npm run dev  # Start local dev server with wrangler
   ```
   - Make changes in your local environment
   - Test with the local dev server (uses local/preview KV namespace)

2. **Deploy to Cloudflare (Production Test)**
   ```bash
   npm run deploy  # or npx wrangler deploy
   ```
   - This pushes your code AND configuration to Cloudflare
   - Includes KV namespace bindings, environment variables, routes, etc.
   - Test the live deployment at your workers.dev URL

3. **Verify Deployment**
   ```bash
   # Check deployment status
   npx wrangler deployments list
   
   # Test the API
   curl -X POST https://your-worker.workers.dev/api/create \
     -H "Content-Type: application/json" \
     -d '{"text":"Test note"}'
   
   # Monitor logs (if needed)
   npx wrangler tail your-worker-name
   ```

4. **Push to GitHub (After Verification)**
   ```bash
   git add .
   git commit -m "Deploy: Updated worker with KV bindings"
   git push origin main
   ```

## Important Configuration Files

### wrangler.toml
This file contains ALL the configuration for your Cloudflare Worker:
- KV namespace bindings
- Environment variables
- Routes and custom domains
- Compatibility dates

**Key Point**: Changes to `wrangler.toml` only take effect after running `wrangler deploy`

### Environment-Specific Configurations

```toml
# Production KV namespace
[[kv_namespaces]]
binding = "NOTES"
id = "3b182a755a0048bf834a600e8cd7f971"
preview_id = "8a6ed224993946a6b9b98099860a9973"  # Used in dev mode
```

## Common Issues & Solutions

### 1. KV Namespace Not Bound
**Symptom**: App crashes when trying to access KV storage
**Solution**: Run `npx wrangler deploy` to sync configuration

### 2. Configuration Mismatch
**Symptom**: Local dev works but production doesn't
**Solution**: Ensure `wrangler.toml` is committed and deployed

### 3. Checking Current Bindings
```bash
# Dry run to see what would be deployed
npx wrangler deploy --dry-run

# List existing KV namespaces
npx wrangler kv namespace list
```

## Rollback Strategy

If a deployment causes issues:
```bash
# List recent deployments
npx wrangler deployments list

# Rollback to a previous version
npx wrangler rollback [version-id]
```

## CI/CD Considerations

For automated deployments:
1. Store `CLOUDFLARE_API_TOKEN` in GitHub Secrets
2. Use GitHub Actions to deploy on push to main:

```yaml
name: Deploy to Cloudflare Workers
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Key Takeaways

1. **wrangler.toml is the source of truth** for Worker configuration
2. **Always deploy after configuration changes** - local changes don't auto-sync
3. **Test in production** before pushing to GitHub
4. **Monitor deployments** using `wrangler deployments list`
5. **Keep configurations in version control** for team collaboration

## Useful Commands Reference

```bash
# Development
npm run dev                          # Start local dev server
npm run check                        # TypeScript type checking

# Deployment
npm run deploy                       # Deploy to production
npx wrangler deploy --dry-run        # Preview deployment without deploying

# Monitoring
npx wrangler tail [worker-name]      # Stream live logs
npx wrangler deployments list        # View deployment history

# KV Management
npx wrangler kv namespace list       # List all KV namespaces
npx wrangler kv key list --namespace-id=[id]  # List keys in namespace
```
