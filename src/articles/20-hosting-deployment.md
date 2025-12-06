---
title: "Deploying Your Laravel API and Vue SPA"
description: "Deploy your Vue 3 SPA on Vercel or Netlify while hosting the Laravel 11 API via Laravel Forge on Digital Ocean or Railway."
tags: ["laravel", "vue", "deployment", "vercel", "forge", "hosting"]
pubDate: "2024-01-20T10:00:00Z"
series: "laravel-vue-spa"
seriesOrder: 20
---

When you're ready to deploy, you'll host the Laravel API and Vue SPA separately. This guide covers hosting the Laravel API through Laravel Forge on Digital Ocean and the Vue SPA on Vercel (or Netlify).

## Laravel API Deployment

### Option 1: Laravel Forge + Digital Ocean

Laravel Forge is purpose-built for deploying Laravel applications. It handles server provisioning, SSL certificates, queue workers, and more.

1. **Create a server** in Forge connected to Digital Ocean (or AWS, Linode, etc.)
2. **Add your SSH key** for local machine access
3. **Create a new site** for `api.yourapp.com`
4. **Connect your GitHub repository** for automatic deployments
5. **Enable Let's Encrypt** for SSL

### Option 2: Railway or Render

For simpler deployments without managing servers:

**Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**

- Create a new Web Service
- Connect your GitHub repo
- Set build command: `composer install && php artisan migrate --force`
- Set start command: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Critical Environment Variables

Regardless of hosting provider, these environment variables are essential for Sanctum to work:

```bash
# Your SPA's domain (no https://)
SANCTUM_STATEFUL_DOMAINS=yourapp.com,www.yourapp.com

# Session cookie domain (note the leading dot for subdomain support)
SESSION_DOMAIN=.yourapp.com

# Your SPA's full URL
SPA_URL=https://yourapp.com

# Set to production
APP_ENV=production
APP_DEBUG=false

# Your production database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
```

### Email Configuration

Add a mail provider for verification emails and password resets:

```bash
# Example with Postmark
MAIL_MAILER=postmark
POSTMARK_TOKEN=your-token

# Example with Mailgun
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=mg.yourapp.com
MAILGUN_SECRET=your-secret

# Common settings
MAIL_FROM_ADDRESS=hello@yourapp.com
MAIL_FROM_NAME="${APP_NAME}"
```

## Vue SPA Deployment

### Option 1: Vercel (Recommended)

Vercel offers the simplest deployment experience for Vue SPAs:

1. **Connect your GitHub repository** at vercel.com
2. **Configure build settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. **Add environment variables:**
   ```
   VITE_API_URL=https://api.yourapp.com
   ```
4. **Deploy**

Create `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Option 2: Netlify

Create `netlify.toml` in your project root:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Add environment variables in the Netlify dashboard:

- `VITE_API_URL` = `https://api.yourapp.com`

### Environment Files

For Vite, create environment-specific files:

```bash
# .env.production
VITE_API_URL=https://api.yourapp.com
```

```bash
# .env.development
VITE_API_URL=http://localhost:8000
```

## DNS Configuration

### If using Vercel for SPA + Forge for API:

1. **SPA (yourapp.com):**

   - Add domain in Vercel dashboard
   - Point DNS to Vercel's nameservers or add CNAME record

2. **API (api.yourapp.com):**
   - Add A record pointing to your Forge server's IP
   - Enable SSL in Forge

### Example DNS records:

```
Type    Name    Value
A       @       76.76.21.21 (Vercel)
CNAME   www     cname.vercel-dns.com
A       api     your-forge-server-ip
```

## CORS Configuration

Update `config/cors.php` for production:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('SPA_URL', 'http://localhost:5173'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## SSL Certificates

Both Vercel and Netlify provide automatic SSL. For Forge:

1. Go to your site in Forge
2. Click "SSL"
3. Select "Let's Encrypt"
4. Enter your domain
5. Forge handles renewal automatically

## Deployment Checklist

### Laravel API:

- [ ] `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Database migrations run: `php artisan migrate --force`
- [ ] Config cached: `php artisan config:cache`
- [ ] Routes cached: `php artisan route:cache`
- [ ] Views cached: `php artisan view:cache`
- [ ] `SANCTUM_STATEFUL_DOMAINS` includes your SPA domain
- [ ] `SESSION_DOMAIN` set with leading dot
- [ ] SSL enabled
- [ ] Queue worker running (if using queues)
- [ ] Scheduler configured (if using scheduled tasks)

### Vue SPA:

- [ ] `VITE_API_URL` points to production API
- [ ] SPA routing configured (vercel.json or netlify.toml)
- [ ] Build succeeds: `npm run build`
- [ ] SSL enabled
- [ ] Test authentication flow end-to-end

## Troubleshooting

### CORS Errors

- Verify `SANCTUM_STATEFUL_DOMAINS` includes your exact SPA domain
- Check `supports_credentials` is `true` in cors.php
- Ensure both SPA and API use HTTPS

### 419 Session Expired

- Check `SESSION_DOMAIN` has the leading dot
- Verify cookies are being set (check browser dev tools)
- Ensure CSRF cookie is being fetched before login

### 401 Unauthenticated

- Confirm `withCredentials: true` in Axios config
- Check the session driver is correctly configured
- Verify the user exists and credentials are correct

---

_This concludes the Laravel Vue SPA series. You now have a complete authentication system with a Vue 3 SPA consuming a Laravel 11 API, including authorization, file uploads, middleware patterns, and deployment guidance._

**All code examples are copy-paste ready.** If something doesn't work, double-check environment variables and CORS configuration first.
