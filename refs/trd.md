# Technical Requirements Document (TRD)

## 1. Architecture Overview
A modern, monolithic, serverless web application built for maximum speed and scalability. The architecture strictly separates the read-heavy public frontend from the write-heavy backend operations.

* **Framework:** Next.js 14 (App Router).
* **Deployment:** Vercel (Edge Network & Serverless Functions).
* **Database:** Neon Serverless PostgreSQL (Partitioned Architecture).
* **Database Access:** STRICTLY RAW SQL (using `@neondatabase/serverless` or `pg`). **NO ORM**.
* **Caching & Resilience:** Upstash Redis (KV storage, Rate Limiting, High-Traffic Stock Decrements).
* **Storage:** Vercel Blob Storage (for user/campaign image uploads if any).
* **Validation:** Zod (for strict API payload and form validation).
* **Styling:** Tailwind CSS + Radix UI/Shadcn (Reusable Components).

## 2. Rendering Strategy ("Zero-Loading" Mandate)
* **ISR (Incremental Static Regeneration):** Used for `/`, `/campaigns`, and `/campaigns/[slug]`. Data is fetched via Raw SQL, rendered to static HTML, and cached at the Vercel Edge. Revalidated every 60 seconds.
* **Client Components (CSR):** Used ONLY for interactive islands (e.g., Checkout Form, Donor Login, Tab interactions) wrapped inside Server Components.
* **Next Image:** Strict usage of `next/image` for automatic WebP conversion and lazy loading.

## 3. Database Strategy (Neon DB)
* **Connection Pooling:** Must use HTTP/WebSocket driver provided by Neon to prevent connection exhaustion in serverless environments.
* **Migrations & Seeding:** Handled externally by the Admin Panel repository. The Public App assumes the database schema is complete and immutable.
* **Querying:** Raw SQL with parameterized queries to prevent SQL injection (`SELECT * FROM campaigns WHERE slug = $1`).

## 4. High-Traffic Resilience (Flash Donation Protocol)
* **Checkout Validation:** Stock for Qurban variants is checked and decremented atomically via Upstash Redis (`DECRBY`).
* **Async Webhooks:** Next.js API Routes (`/api/webhooks/...`) handle payment callbacks by writing fast SQL updates and offloading heavy tasks (Email, WA notifications, Ads CAPI) to Upstash QStash.

## 5. Environment Variables (`.env`)
Required variables include:
* `DATABASE_URL` (Neon Postgres)
* `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
* `BLOB_READ_WRITE_TOKEN`
* `NEXT_PUBLIC_BASE_URL`