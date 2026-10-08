# Security and offline behavior

## What this site can and cannot protect

PCT24X7 is exported as static HTML, CSS, JavaScript, images and catalog files. The site does not have a user database, login system, order API or server-side write endpoint. That keeps the application attack surface smaller than a typical dynamic web app, but it does not make the site or its hosting account unhackable.

A browser cache is a copy on that visitor's device. It can reduce repeat downloads and keep a previously saved copy usable offline, but it does **not** make first visits offline, route other visitors through that visitor's computer, or stop requests sent directly to Cloudflare. A service worker is installed after an online visit and caches the exported app and catalog. Browsers can clear or evict that storage, so offline availability is best-effort rather than permanent.

The catalog and every `NEXT_PUBLIC_*` value are public. The XOR format is obfuscation, not encryption; its key is present in the client bundle and must never be treated as a secret. Do not put private customer, payment or account data in the public catalog or browser cache.

## Repository protections

- `public/_headers` sets HSTS, MIME sniffing protection, clickjacking protection, a restrictive permissions policy and a referrer policy. The production build generates a Content Security Policy with hashes for the exact inline scripts in the static export.
- The static build precaches only files produced by the build, with a content-derived service-worker cache version. Old app-shell caches are removed on activation.
- Catalog downloads are cached on-device after a successful, valid response and may be used as a network-failure fallback.
- Raw source catalog JSON is rejected by `scripts/check-public-data.mjs` before the production build.

## Hosting and account checklist

These settings cannot be guaranteed by repository code. Before release, verify them in the hosting and source-control accounts:

1. Require HTTPS for the production hostname and keep Cloudflare's DDoS protections enabled. Review WAF/bot controls and rate limits if a dynamic endpoint is added later.
2. Protect GitHub and Cloudflare accounts with MFA/passkeys, least-privilege access and protected deployment credentials. Restrict who can publish a Worker.
3. Review dependency alerts and update vulnerable dependencies; build and deploy from the reviewed branch.
4. Use a custom domain under the business's control for the public website and SEO. `NEXT_PUBLIC_SITE_URL` configures canonical and social metadata; change it when the hostname changes.
5. Do not add public forms, authentication, orders or payments without a separate threat model and server-side controls.

No automated scan or static-site feature can certify that a site will never be breached. If a deployment or account is compromised, revoke/rotate affected credentials, roll back the Worker and investigate the publishing account and build pipeline.
