# Sentry and Performance Monitoring

## Sentry Integration

1. Add dependencies:
```
npm i @sentry/nextjs
```
2. Set environment variables:
```
SENTRY_DSN=your_dsn
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=auto
```
3. Initialize Sentry using the official setup:
```
npx @sentry/wizard -i nextjs
```
4. Confirm server and client error capture in Sentry.

## Web Vitals

Basic navigation timings are captured client-side and posted to `/api/analytics/track`. For full Web Vitals metrics, add the `web-vitals` package and extend the provider.